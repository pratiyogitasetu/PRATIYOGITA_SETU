#!/usr/bin/env python3
"""
Sawal Jawab Flask Backend
API providing backend services for the PYQ search and practice interface
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import time
import hashlib
import re
from groq import Groq
from pinecone import Pinecone
try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

import httpx
try:
    from openai import OpenAI
except Exception:
    OpenAI = None
import threading
from concurrent.futures import ThreadPoolExecutor
import uuid
from functools import wraps
import traceback
from dotenv import load_dotenv
load_dotenv()

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")

DEBUG_MODE = os.getenv('DEBUG_MODE', '0').lower() in {'1', 'true', 'yes'}
MAX_CACHE_SIZE = int(os.getenv('MAX_CACHE_SIZE', '100'))
CACHE_CLEANUP_INTERVAL = int(os.getenv('CACHE_CLEANUP_INTERVAL', '300'))
RATE_LIMIT_MAX_REQUESTS = int(os.getenv('RATE_LIMIT_MAX_REQUESTS', '30'))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv('RATE_LIMIT_WINDOW_SECONDS', '60'))

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

# Setup CORS
ALLOWED_ORIGINS_RAW = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://localhost:3002')
ALLOWED_ORIGINS = ALLOWED_ORIGINS_RAW.split(',')

CORS(app, 
     origins=ALLOWED_ORIGINS,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
     supports_credentials=True)

import logging
logging.basicConfig(
    level=logging.DEBUG if DEBUG_MODE else logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
app.logger.setLevel(logging.DEBUG if DEBUG_MODE else logging.INFO)

# Global variables
search_components = {}
system_initialized = False
rate_limit_storage = {}
rate_limit_lock = threading.Lock()
_init_lock = threading.Lock()

# Simple Cache
_cache_store = {}
_cache_lock = threading.Lock()
_last_cleanup = time.time()

def _cleanup_cache():
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < CACHE_CLEANUP_INTERVAL:
        return
    with _cache_lock:
        expired_keys = [k for k, (_, exp) in _cache_store.items() if exp and now > exp]
        for k in expired_keys:
            _cache_store.pop(k, None)
        _last_cleanup = now
        if len(_cache_store) > MAX_CACHE_SIZE:
            items_with_time = [(k, v[1] or 0) for k, v in _cache_store.items()]
            items_with_time.sort(key=lambda x: x[1])
            to_remove = items_with_time[:int(MAX_CACHE_SIZE * 0.2)]
            for k, _ in to_remove:
                _cache_store.pop(k, None)

def _get_cached_value(key):
    now = time.time()
    _cleanup_cache()
    with _cache_lock:
        entry = _cache_store.get(key)
        if not entry:
            return None
        value, expires_at = entry
        if expires_at and now > expires_at:
            _cache_store.pop(key, None)
            return None
        return value

def _set_cached_value(key, value, ttl_seconds=None):
    expires_at = time.time() + ttl_seconds if ttl_seconds else None
    with _cache_lock:
        _cache_store[key] = (value, expires_at)

def _get_index_stats_cached(index, cache_key, ttl_seconds=60):
    cached = _get_cached_value(cache_key)
    if cached is not None:
        return cached
    stats = index.describe_index_stats()
    _set_cached_value(cache_key, stats, ttl_seconds)
    return stats

def rate_limit(max_requests=None, window_seconds=None):
    if max_requests is None:
        max_requests = RATE_LIMIT_MAX_REQUESTS
    if window_seconds is None:
        window_seconds = RATE_LIMIT_WINDOW_SECONDS
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            current_time = time.time()
            with rate_limit_lock:
                stale_ips = []
                for ip, timestamps in rate_limit_storage.items():
                    recent = [ts for ts in timestamps if current_time - ts < window_seconds]
                    if recent:
                        rate_limit_storage[ip] = recent
                    else:
                        stale_ips.append(ip)
                for ip in stale_ips:
                    rate_limit_storage.pop(ip, None)
                bucket = rate_limit_storage.setdefault(client_ip, [])
                if len(bucket) >= max_requests:
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'message': f'Maximum {max_requests} requests per {window_seconds} seconds'
                    }), 429
                bucket.append(current_time)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.after_request
def after_request(response):
    response.headers.add('X-Content-Type-Options', 'nosniff')
    response.headers.add('X-Frame-Options', 'DENY')
    response.headers.add('X-XSS-Protection', '1; mode=block')
    return response

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

def load_api_keys():
    openai_api_key = os.getenv('OPENAI_API_KEY')
    groq_api_key = os.getenv('GROQ_API_KEY')
    pine_api_key = os.getenv('PINECONE_API_KEY')
    return openai_api_key, groq_api_key, pine_api_key

def create_mcq_embedding_model():
    """Create MCQ embedding model aligned with sentence-transformers/all-MiniLM-L6-v2."""
    local_model = os.getenv("MCQ_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    embedding_device = os.getenv("MCQ_EMBEDDING_DEVICE", "cpu")
    
    if SentenceTransformer is None:
        raise RuntimeError("sentence-transformers is not installed. Install with: pip install sentence-transformers")
        
    app.logger.info(f"Loading local embedding model: {local_model}")
    return SentenceTransformer(local_model, device=embedding_device), "sentence-transformers-local"

def refine_query_with_groq(query: str) -> str:
    """Refine user search query using Groq API to correct spelling mistakes, grammatical issues, or incorrect terms, and formulate it into a search-optimized sentence or set of keywords."""
    groq_client = search_components.get('client')
    if not groq_client:
        app.logger.warning("Groq client not available, skipping query refinement.")
        return query
    
    prompt = (
        "You are an AI assistant designed to correct spelling mistakes, typos, and grammatical errors in search queries. "
        "Your task is to fix spelling and typos while preserving the exact phrasing, sentence structure, and vocabulary of the user's input query. "
        "Do NOT rewrite, optimize, summarize, or truncate the query. Only correct the misspelled words. "
        "Strict Rule: Output ONLY the corrected text. Do NOT add any notes, explanation, quotes, or formatting.\n\n"
        f"Original Query: {query}\n"
        "Corrected Query:"
    )
    
    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a precise spelling and typo correction assistant. Output ONLY the corrected text, maintaining the original sentence structure exactly."},
                {"role": "user", "content": prompt},
            ],
            model=search_components.get('groq_model', 'llama-3.1-8b-instant'),
            max_tokens=100,
            temperature=0.1,
        )
        refined = (response.choices[0].message.content or '').strip()
        refined = re.sub(r'^["\']|["\']$', '', refined)
        app.logger.info(f"Corrected query with Groq: '{query}' -> '{refined}'")
        return refined if refined else query
    except Exception as e:
        app.logger.error(f"Error correcting query with Groq: {e}. Using original query.")
        return query

def encode_query(model, text: str):
    ttl_seconds = int(os.getenv("EMBEDDING_CACHE_TTL", "600"))
    cache_key = f"embed:{hashlib.sha256(text.encode()).hexdigest()}"
    cached = _get_cached_value(cache_key)
    if cached is not None:
        return cached

    try:
        encoded = model.encode([text], normalize_embeddings=True, show_progress_bar=False)
        vector = list(map(float, encoded[0]))
        _set_cached_value(cache_key, vector, ttl_seconds)
        return vector
    except Exception as e:
        raise RuntimeError(f"Embedding failed: {e}")

def _match_dimension_error(message: str):
    if not message:
        return None, None
    match = re.search(
        r"Vector dimension\s*(\d+)\s*does not match the dimension of the index\s*(\d+)",
        message,
        re.IGNORECASE,
    )
    if not match:
        return None, None
    return int(match.group(1)), int(match.group(2))

def _resize_vector(vector, target_dim: int):
    if target_dim <= 0:
        return vector
    if len(vector) == target_dim:
        return vector
    if len(vector) > target_dim:
        return vector[:target_dim]
    return vector + [0.0] * (target_dim - len(vector))

def safe_pinecone_query(index, vector, **kwargs):
    try:
        return index.query(vector=vector, **kwargs)
    except Exception as e:
        query_dim, index_dim = _match_dimension_error(str(e))
        if not index_dim:
            raise
        adjusted_vector = _resize_vector(vector, index_dim)
        app.logger.warning(
            f"Pinecone dimension mismatch detected (query={query_dim}, index={index_dim}). Retrying with adjusted vector."
        )
        return index.query(vector=adjusted_vector, **kwargs)

def initialize_search_system():
    global search_components, system_initialized
    try:
        app.logger.info("🔧 Initializing Sawal Jawab search system...")
        openai_api_key, groq_api_key, pine_api_key = load_api_keys()
        
        if pine_api_key:
            pc_mcq = Pinecone(api_key=pine_api_key)
            mcq_index_name = os.getenv('MCQ_INDEX_NAME', 'pyq-bge-768')
            mcq_index = pc_mcq.Index(mcq_index_name)
            mcq_model, embedding_backend = create_mcq_embedding_model()
            
            search_components['mcq_index'] = mcq_index
            search_components['mcq_model'] = mcq_model
            app.logger.info(f"✅ MCQ index and model initialized using {embedding_backend}")
        else:
            app.logger.error("❌ PINECONE_API_KEY missing!")

        if openai_api_key and OpenAI is not None:
            openai_timeout = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "20"))
            search_components['openai_client'] = OpenAI(api_key=openai_api_key, timeout=openai_timeout)
            search_components['openai_model'] = os.getenv('OPENAI_MODEL_NAME', 'gpt-4o-mini')
            app.logger.info("✅ OpenAI client initialized")

        if groq_api_key:
            search_components['client'] = Groq(api_key=groq_api_key)
            search_components['groq_model'] = os.getenv('GROQ_MODEL_NAME', 'llama-3.1-8b-instant')
            app.logger.info("✅ Groq client initialized")
            
        system_initialized = True
        app.logger.info("✅ Search system initialized successfully")
        return True
    except Exception as e:
        app.logger.error(f"❌ Failed to initialize search system: {str(e)}")
        system_initialized = True
        return False

def ensure_initialized():
    global system_initialized
    if system_initialized:
        return
    with _init_lock:
        if not system_initialized:
            initialize_search_system()

@app.before_request
def _initialize_on_first_request():
    ensure_initialized()

@app.route("/api/health", methods=["GET"])
def health_check():
    if not system_initialized:
        ensure_initialized()
    health_status = {
        "status": "healthy",
        "system_initialized": system_initialized,
        "timestamp": time.time(),
        "version": "1.0.0"
    }
    components = {}
    if system_initialized:
        try:
            if 'mcq_index' in search_components:
                mcq_stats = _get_index_stats_cached(search_components['mcq_index'], 'mcq_index_stats', ttl_seconds=60)
                components['mcq_index'] = {
                    "status": "healthy", 
                    "total_vectors": mcq_stats.total_vector_count
                }
            if 'mcq_model' in search_components:
                components['mcq_model'] = {"status": "healthy"}
            if 'openai_client' in search_components:
                components['openai_client'] = {"status": "healthy"}
            if 'client' in search_components:
                components['groq_client'] = {"status": "healthy"}
        except Exception as e:
            health_status["status"] = "degraded"
            health_status["error"] = str(e)
    health_status["components"] = components
    return jsonify(health_status), 200 if health_status["status"] == "healthy" else 503

@app.route("/api/total-questions", methods=["GET"])
def get_total_questions():
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    try:
        mcq_index = search_components.get('mcq_index')
        if not mcq_index:
            return jsonify({"error": "MCQ index not available"}), 500
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        total_questions = stats.get('total_vector_count', 0)
        return jsonify({
            "total_questions": total_questions,
            "status": "success",
            "timestamp": time.time()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e), "total_questions": 0}), 500

@app.route("/api/pyq/search", methods=["POST"])
@rate_limit(max_requests=30, window_seconds=60)
def search_pyq_questions():
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    try:
        data = request.get_json() or {}
        query = data.get('query', '')
        exam_filter = data.get('exam', None)
        subject_filter = data.get('subject', None)
        year_filter = data.get('year', None)
        limit = data.get('limit', 50)
        
        mcq_index = search_components.get('mcq_index')
        mcq_model = search_components.get('mcq_model')
        if not mcq_index or not mcq_model:
            return jsonify({"error": "MCQ system not available"}), 500
        
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        namespaces = list(stats.namespaces.keys()) if stats.namespaces else []
        
        target_namespaces = namespaces
        if exam_filter and exam_filter != 'all':
            target_namespaces = [ns for ns in namespaces if exam_filter.lower().replace('_', ' ') in ns.lower()]
            if not target_namespaces:
                target_namespaces = namespaces
        
        refined_query = query
        if query:
            refined_query = refine_query_with_groq(query)
            query_embedding = encode_query(mcq_model, refined_query)
        else:
            query_embedding = encode_query(mcq_model, "general knowledge question")

        all_questions = []
        for namespace in target_namespaces[:5]:
            try:
                results = safe_pinecone_query(
                    mcq_index,
                    query_embedding,
                    top_k=min(limit + 10, 100),
                    include_metadata=True,
                    namespace=namespace
                )
                for match in results['matches']:
                    metadata = match.get('metadata', {})
                    full_data = {}
                    if 'full_json_str' in metadata:
                        try:
                            full_data = json.loads(metadata['full_json_str'])
                        except:
                            pass
                    
                    exam_name = full_data.get('exam_name', metadata.get('exam_name', ''))
                    exam_year = str(full_data.get('exam_year', metadata.get('exam_year', '')))
                    exam_term = full_data.get('exam_term', metadata.get('exam_term', ''))
                    subject = full_data.get('subject', metadata.get('subject', ''))
                    question_text = full_data.get('question', metadata.get('question', ''))
                    explanation = full_data.get('explanation', metadata.get('explanation', ''))
                    correct_option = full_data.get('correct_option', metadata.get('correct_option', ''))
                    
                    options_dict = full_data.get('options', {})
                    if not options_dict:
                        options_dict = {}
                        for opt_key in ['option_a', 'option_b', 'option_c', 'option_d']:
                            if metadata.get(opt_key):
                                options_dict[opt_key.replace('option_', '').upper()] = metadata.get(opt_key)
                    
                    options_list = []
                    for k in ['A', 'B', 'C', 'D']:
                        opt_value = options_dict.get(k) or options_dict.get(k.lower())
                        if opt_value:
                            options_list.append(opt_value)
                    
                    correct_answer_index = None
                    if correct_option:
                        option_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3}
                        correct_answer_index = option_map.get(correct_option)
                    
                    # Apply Filters
                    if exam_filter and exam_filter != 'all':
                        exam_lower = exam_name.lower().replace(' ', '_').replace('/', '_')
                        if exam_filter.lower() not in exam_lower:
                            continue
                    if subject_filter and subject_filter != 'all':
                        subject_lower = subject.lower().replace(' ', '_')
                        if subject_filter.lower() not in subject_lower:
                            continue
                    if year_filter and year_filter != 'all':
                        if str(year_filter) != str(exam_year):
                            continue
                    
                    all_questions.append({
                        'id': match['id'],
                        'question': question_text,
                        'options': options_list,
                        'correct_answer': correct_answer_index,
                        'correct_option': correct_option,
                        'explanation': explanation,
                        'exam_name': exam_name,
                        'year': exam_year,
                        'term': exam_term,
                        'subject': subject,
                        'namespace': namespace,
                        'score': match.get('score', 0)
                    })
            except Exception as e:
                app.logger.warning(f"Error querying namespace {namespace}: {str(e)}")
                continue
        
        all_questions.sort(key=lambda x: x['score'], reverse=True)
        return jsonify({
            'questions': all_questions[:limit],
            'total': len(all_questions[:limit]),
            'status': 'success',
            'refined_query': refined_query
        }), 200
    except Exception as e:
        app.logger.error(f"Error searching PYQ: {str(e)}")
        return jsonify({'error': str(e), 'questions': [], 'total': 0}), 500

@app.route("/api/pyq/filters", methods=["GET"])
@rate_limit(max_requests=20, window_seconds=60)
def get_pyq_filters():
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    try:
        mcq_index = search_components.get('mcq_index')
        mcq_model = search_components.get('mcq_model')
        if not mcq_index or not mcq_model:
            return jsonify({"error": "MCQ system not available"}), 500
        
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        namespaces = list(stats.namespaces.keys()) if stats.namespaces else []
        
        exams_set = set()
        subjects_set = set()
        years_set = set()
        
        dummy_query = encode_query(mcq_model, "sample")
        
        for namespace in namespaces[:5]:
            try:
                results = safe_pinecone_query(
                    mcq_index,
                    dummy_query,
                    top_k=50,
                    include_metadata=True,
                    namespace=namespace
                )
                for match in results['matches']:
                    metadata = match.get('metadata', {})
                    full_data = {}
                    if 'full_json_str' in metadata:
                        try:
                            full_data = json.loads(metadata['full_json_str'])
                        except:
                            pass
                    exam_name = full_data.get('exam_name', metadata.get('exam_name', ''))
                    exam_year = str(full_data.get('exam_year', metadata.get('exam_year', '')))
                    subject = full_data.get('subject', metadata.get('subject', ''))
                    
                    if exam_name and "coming soon" not in exam_name.lower():
                        exams_set.add(exam_name)
                    if exam_year and exam_year != 'Unknown':
                        years_set.add(exam_year)
                    if subject:
                        subjects_set.add(subject)
            except Exception as e:
                app.logger.error(f"Error sampling namespace {namespace}: {str(e)}")
                continue
                
        return jsonify({
            'exams': sorted(list(exams_set)),
            'subjects': sorted(list(subjects_set)),
            'years': sorted(list(years_set), reverse=True),
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e), 'exams': [], 'subjects': [], 'years': []}), 500

@app.route("/api/pyq/random", methods=["POST"])
@rate_limit(max_requests=30, window_seconds=60)
def get_random_pyq_questions():
    try:
        data = request.get_json() or {}
        count = data.get('count', 10)
        exam_filter = data.get('exam', None)
        subject_filter = data.get('subject', None)
        year_filter = data.get('year', None)
        
        search_data = {
            'query': '',
            'exam': exam_filter,
            'subject': subject_filter,
            'year': year_filter,
            'limit': count * 2
        }
        
        import random
        request._cached_json = search_data
        response, status = search_pyq_questions()
        
        if status == 200:
            result = response.get_json()
            questions = result.get('questions', [])
            random.shuffle(questions)
            return jsonify({
                'questions': questions[:count],
                'status': 'success'
            }), 200
        else:
            return response, status
    except Exception as e:
        return jsonify({'error': str(e), 'questions': []}), 500

@app.route("/api/pyq/explain", methods=["POST"])
@rate_limit(max_requests=40, window_seconds=60)
def generate_pyq_explanation():
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    try:
        request_id = uuid.uuid4().hex[:12]
        started_at = time.time()
        data = request.get_json() or {}
        question = str(data.get('question', '')).strip()[:1200]
        options = data.get('options', [])
        correct_answer = data.get('correct_answer', None)
        correct_option = str(data.get('correct_option', '')).strip()[:4]
        correct_answer_text = str(data.get('correct_answer_text', '')).strip()[:400]
        subject = str(data.get('subject', '')).strip()[:120]
        exam_name = str(data.get('exam_name', '')).strip()[:120]
        existing_explanation = str(data.get('existing_explanation', '')).strip()[:1200]
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
            
        option_labels = ['A', 'B', 'C', 'D']
        option_lines = [f"{option_labels[i]}) {options[i]}" for i in range(min(len(options), 4))]
        options_block = "\n".join(option_lines)
        
        prompt = (
            "You are an exam preparation tutor. Generate a clear and concise MCQ explanation.\n\n"
            f"Exam: {exam_name or 'Unknown'}\n"
            f"Subject: {subject or 'General'}\n"
            f"Question: {question}\n"
            f"Options:\n{options_block}\n"
            f"Correct Answer: {correct_answer_text}\n\n"
            "Instructions:\n"
            "1) Explain why the correct answer is right in simple language.\n"
            "2) Briefly mention why other options are not correct (single short line).\n"
            "3) Keep it exam-focused and practical.\n"
            "4) Keep response within 60-100 words.\n"
            "5) Output plain text only."
        )

        openai_client = search_components.get('openai_client')
        if openai_client:
            try:
                response = openai_client.chat.completions.create(
                    model=search_components.get('openai_model', 'gpt-4o-mini'),
                    messages=[
                        {"role": "system", "content": "You are a precise educational assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    max_tokens=150,
                    temperature=0.2,
                    top_p=0.9
                )
                content = (response.choices[0].message.content or '').strip()
                if content:
                    return jsonify({
                        'status': 'success',
                        'provider': 'openai',
                        'explanation': content,
                        'request_id': request_id,
                        'elapsed_ms': int((time.time() - started_at) * 1000)
                    }), 200
            except Exception as e:
                app.logger.warning(f"OpenAI explanation failed: {e}")

        groq_client = search_components.get('client')
        if groq_client:
            try:
                response = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a precise educational assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    model=search_components.get('groq_model', 'llama-3.1-8b-instant'),
                    max_tokens=150,
                    temperature=0.2,
                    top_p=0.9
                )
                content = (response.choices[0].message.content or '').strip()
                if content:
                    return jsonify({
                        'status': 'success',
                        'provider': 'groq',
                        'explanation': content,
                        'request_id': request_id,
                        'elapsed_ms': int((time.time() - started_at) * 1000)
                    }), 200
            except Exception as e:
                app.logger.warning(f"Groq explanation failed: {e}")

        return jsonify({
            'status': 'fallback',
            'provider': 'none',
            'explanation': existing_explanation or f"Correct answer is: {correct_answer_text}.",
            'request_id': request_id
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard Mock Stats (matches same schema as pratiyogita_gyan)
user_stats = {
    'total_chats': 0,
    'total_questions': 0,
    'total_mcq_attempted': 0,
    'mcq_correct': 0,
    'mcq_wrong': 0,
    'subjects': {
        'Geography': 0,
        'Polity': 0,
        'History': 0,
        'Economics': 0,
        'Science': 0,
        'Others': 0
    },
    'achievements': [],
    'goals': [
        {'id': 1, 'title': 'Daily Questions', 'current': 0, 'target': 10, 'type': 'daily'},
        {'id': 2, 'title': 'Weekly Sessions', 'current': 0, 'target': 7, 'type': 'weekly'},
        {'id': 3, 'title': 'Subject Coverage', 'current': 0, 'target': 5, 'type': 'subjects'}
    ],
    'activities': []
}

@app.route("/api/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    total_attempted = user_stats['total_mcq_attempted']
    accuracy = round((user_stats['mcq_correct'] / total_attempted) * 100, 1) if total_attempted > 0 else 0
    return jsonify({
        'totalChats': user_stats['total_chats'],
        'totalQuestions': user_stats['total_questions'],
        'totalMcqAttempted': user_stats['total_mcq_attempted'],
        'mcqCorrect': user_stats['mcq_correct'],
        'mcqWrong': user_stats['mcq_wrong'],
        'mcqAccuracy': accuracy
    }), 200

@app.route("/api/dashboard/subjects", methods=["GET"])
def get_subject_stats():
    subjects = []
    colors = ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280']
    for i, (subject, count) in enumerate(user_stats['subjects'].items()):
        subjects.append({
            'name': subject,
            'questions': count,
            'color': colors[i % len(colors)]
        })
    return jsonify({'subjects': subjects}), 200

@app.route("/api/dashboard/track", methods=["POST"])
def track_user_interaction():
    try:
        data = request.json or {}
        interaction_type = data.get('type', '')
        interaction_data = data.get('data', {})
        timestamp = data.get('timestamp', time.time())
        
        if interaction_type == 'search':
            user_stats['total_questions'] += 1
            subject = interaction_data.get('subject', 'Others')
            if subject in user_stats['subjects']:
                user_stats['subjects'][subject] += 1
            else:
                user_stats['subjects']['Others'] += 1
        elif interaction_type == 'mcq_attempt':
            user_stats['total_mcq_attempted'] += 1
            if interaction_data.get('correct', False):
                user_stats['mcq_correct'] += 1
            else:
                user_stats['mcq_wrong'] += 1
                
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/api/dashboard/update-stats", methods=["POST"])
def update_user_stats():
    data = request.json or {}
    for key, value in data.items():
        if key in user_stats and isinstance(value, (int, float)):
            user_stats[key] = value
    return jsonify({'success': True}), 200

if __name__ == "__main__":
    initialize_search_system()
    port = int(os.getenv('PORT', 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
