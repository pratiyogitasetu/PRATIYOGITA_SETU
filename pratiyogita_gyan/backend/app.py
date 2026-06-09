#!/usr/bin/env python3
"""
Updated Flask Backend for React Frontend
Flask API providing backend services for the React chat interface
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

try:
    from fastembed import TextEmbedding
except Exception:
    TextEmbedding = None
import httpx
try:
    from huggingface_hub import InferenceClient
except Exception:
    InferenceClient = None
try:
    from openai import OpenAI
except Exception:
    OpenAI = None
import threading
from concurrent.futures import ThreadPoolExecutor
import uuid
from functools import wraps
import traceback

# Constrain native library threading for low-RAM free tiers (Render, etc.)
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")
os.environ.setdefault("FASTEMBED_CACHE_PATH", "/tmp/fastembed_cache")

# Debug mode control (set DEBUG_MODE=1 in .env to enable verbose logging)
DEBUG_MODE = os.getenv('DEBUG_MODE', '0').lower() in {'1', 'true', 'yes'}

# Cache configuration to prevent memory leaks
MAX_CACHE_SIZE = int(os.getenv('MAX_CACHE_SIZE', '100'))  # Maximum number of cached items
CACHE_CLEANUP_INTERVAL = int(os.getenv('CACHE_CLEANUP_INTERVAL', '300'))  # Clean expired entries every 5 minutes

# Rate limiting configuration (adjust based on your Heroku plan)
RATE_LIMIT_MAX_REQUESTS = int(os.getenv('RATE_LIMIT_MAX_REQUESTS', '20'))  # Max requests per window
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv('RATE_LIMIT_WINDOW_SECONDS', '60'))  # Time window in seconds

# Optional dotenv - for local development only
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # On production, env vars are set directly

app = Flask(__name__)

# Request size limit to prevent memory issues (1MB)
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

# Production-ready CORS configuration
# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS_RAW = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://localhost:3001,http://localhost:3002')
ALLOWED_ORIGINS = ALLOWED_ORIGINS_RAW.split(',')

# Validate ALLOWED_ORIGINS in production
if os.getenv('FLASK_ENV') == 'production':
    if not os.getenv('ALLOWED_ORIGINS'):
        raise RuntimeError('ALLOWED_ORIGINS environment variable must be set in production')
    # Validate all origins use HTTPS in production
    for origin in ALLOWED_ORIGINS:
        origin = origin.strip()
        if origin and not origin.startswith('https://'):
            raise RuntimeError(f'Production origin must use HTTPS: {origin}')

# Add production frontend URL if in production
if os.getenv('FLASK_ENV') == 'production':
    # User should set ALLOWED_ORIGINS env var with their Vercel URL
    # Example: ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-preview.vercel.app
    pass

CORS(app, 
     origins=ALLOWED_ORIGINS,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
     supports_credentials=True)

# Configure production logging
import logging
if os.getenv('FLASK_ENV') == 'production':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s'
    )
    app.logger.setLevel(logging.INFO)
else:
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    app.logger.setLevel(logging.DEBUG)

# Silence noisy HTTP client debug logs unless explicitly needed
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

# Global variables to store initialized components
search_components = {}
system_initialized = False
rate_limit_storage = {}
rate_limit_lock = threading.Lock()
_init_lock = threading.Lock()

# Simple in-memory cache for expensive read-only operations
_cache_store = {}
_cache_lock = threading.Lock()
_last_cleanup = time.time()

def _cleanup_cache():
    """Remove expired entries to prevent memory leaks."""
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < CACHE_CLEANUP_INTERVAL:
        return
    
    with _cache_lock:
        expired_keys = [k for k, (_, exp) in _cache_store.items() if exp and now > exp]
        for k in expired_keys:
            _cache_store.pop(k, None)
        _last_cleanup = now
        
        # Enforce max cache size using LRU (remove oldest if over limit)
        if len(_cache_store) > MAX_CACHE_SIZE:
            # Simple LRU: remove 20% of oldest entries
            items_with_time = [(k, v[1] or 0) for k, v in _cache_store.items()]
            items_with_time.sort(key=lambda x: x[1])
            to_remove = items_with_time[:int(MAX_CACHE_SIZE * 0.2)]
            for k, _ in to_remove:
                _cache_store.pop(k, None)

def _get_cached_value(key):
    now = time.time()
    _cleanup_cache()  # Periodic cleanup
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


def safe_int(value, default, min_value=None, max_value=None):
    """Safely parse int with optional clamp bounds."""
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = int(default)

    if min_value is not None:
        parsed = max(min_value, parsed)
    if max_value is not None:
        parsed = min(max_value, parsed)
    return parsed


def safe_float(value, default, min_value=None, max_value=None):
    """Safely parse float with optional clamp bounds."""
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = float(default)

    if min_value is not None:
        parsed = max(min_value, parsed)
    if max_value is not None:
        parsed = min(max_value, parsed)
    return parsed

def rate_limit(max_requests=None, window_seconds=None):
    """Simple rate limiting decorator
    
    Args:
        max_requests: Maximum requests allowed (defaults to RATE_LIMIT_MAX_REQUESTS env)
        window_seconds: Time window in seconds (defaults to RATE_LIMIT_WINDOW_SECONDS env)
    """
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
                # Periodic cleanup of stale IP buckets to prevent unbounded growth
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

                # Check rate limit
                if len(bucket) >= max_requests:
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'message': f'Maximum {max_requests} requests per {window_seconds} seconds'
                    }), 429

                # Add current request
                bucket.append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.after_request
def after_request(response):
    """Add security headers to all responses"""
    # Note: CORS is handled by Flask-CORS, not here
    # Adding wildcard here would override Flask-CORS security settings
    response.headers.add('X-Content-Type-Options', 'nosniff')
    response.headers.add('X-Frame-Options', 'DENY')
    response.headers.add('X-XSS-Protection', '1; mode=block')
    return response

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(413)
def payload_too_large(error):
    return jsonify({
        'error': 'Payload too large',
        'message': 'Request body exceeds 1MB limit'
    }), 413

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500

@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f'Unhandled exception: {str(e)}')
    app.logger.error(traceback.format_exc())
    
    # In production, don't expose internal error details
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    return jsonify({
        'error': 'An unexpected error occurred',
        'message': 'Please try again later' if is_production else str(e),
        'type': type(e).__name__ if not is_production else None
    }), 500

def load_api_keys():
    """Load API keys from environment variables"""
    openai_api_key = os.getenv('OPENAI_API_KEY')
    groq_api_key = os.getenv('GROQ_API_KEY')
    pine_api_key = os.getenv('PINECONE_API_KEY')
    
    is_production = os.getenv('FLASK_ENV') == 'production'

    if not openai_api_key:
        if is_production:
            app.logger.warning("⚠️ OPENAI_API_KEY not found. Primary LLM routing will be unavailable.")
        elif DEBUG_MODE:
            print("\n⚠️ OPENAI_API_KEY not found. Primary LLM routing will be unavailable.\n")

    if not groq_api_key:
        if is_production:
            app.logger.warning("⚠️ GROQ_API_KEY not found. Groq fallback will be unavailable.")
        elif DEBUG_MODE:
            print("\n⚠️ GROQ_API_KEY not found. Groq fallback will be unavailable.\n")
    
    if not pine_api_key:
        if is_production:
            app.logger.error("❌ CRITICAL: PINECONE_API_KEY not found in environment variables!")
        elif DEBUG_MODE:
            print("\n❌ CRITICAL: PINECONE_API_KEY not found in environment variables!")
            print("   Please create a .env file with your API keys or set them in your environment.")
            print("   Example: PINECONE_API_KEY=your_key_here\n")

    return openai_api_key, groq_api_key, pine_api_key

try:
    import torch
except Exception:
    torch = None
import inspect
from typing import Any, Dict

# Reduce CPU thread usage to lower memory/CPU pressure on small instances
if torch is not None:
    torch.set_num_threads(1)
    try:
        torch.set_num_interop_threads(1)
    except Exception:
        pass
    torch.set_grad_enabled(False)

def create_sentence_transformer(model_name: str, device: str = "cpu"):
    """Create SentenceTransformer with backward-compatible kwargs."""
    if SentenceTransformer is None:
        error_msg = "sentence-transformers is not installed. Install with: pip install sentence-transformers"
        app.logger.error(error_msg)
        raise RuntimeError(error_msg)
    kwargs: Dict[str, Any] = {"device": device}
    try:
        sig = inspect.signature(SentenceTransformer.__init__)
        if "model_kwargs" in sig.parameters:
            kwargs["model_kwargs"] = {"torch_dtype": torch.float32}
    except Exception:
        # Fallback for older sentence-transformers versions
        pass
    return SentenceTransformer(model_name, **kwargs)  # type: ignore[call-arg]

def create_embedding_model():
    """Create embedding model aligned with RAG v2 defaults (BGE-base, 768d)."""
    provider = os.getenv("EMBEDDING_PROVIDER", "local").strip().lower()
    local_model = os.getenv("LOCAL_EMBEDDING_MODEL", "BAAI/bge-base-en-v1.5")
    embedding_device = os.getenv("EMBEDDING_DEVICE", "cpu")

    if provider == "local":
        try:
            return create_sentence_transformer(local_model, device=embedding_device), "sentence-transformers-local"
        except Exception as e:
            if os.getenv('FLASK_ENV') == 'production':
                app.logger.warning(f"⚠️  Local embedding model failed, trying fallbacks: {e}")
            else:
                if DEBUG_MODE:
                    app.logger.warning(f"⚠️  Local embedding model failed, trying fallbacks: {e}")

    use_hf = os.getenv("USE_HF_EMBEDDINGS", "0").lower() in {"1", "true", "yes"}
    if use_hf:
        hf_token = os.getenv("HF_API_KEY")
        hf_model = os.getenv("HF_EMBEDDING_MODEL", local_model)
        if not hf_token:
            error_msg = "HF_API_KEY is required when USE_HF_EMBEDDINGS=1"
            app.logger.error(error_msg)
            raise RuntimeError(error_msg)
        return HFEmbeddingClient(hf_token, hf_model), "huggingface"

    use_fastembed = os.getenv("USE_FASTEMBED", "1").lower() in {"1", "true", "yes"}
    if use_fastembed and TextEmbedding is not None:
        model_name = os.getenv("FASTEMBED_MODEL", "BAAI/bge-base-en-v1.5")
        cache_path = os.getenv("FASTEMBED_CACHE_PATH", "/tmp/fastembed_cache")
        try:
            os.makedirs(cache_path, exist_ok=True)
            os.environ["FASTEMBED_CACHE_PATH"] = cache_path
            return TextEmbedding(model_name), "fastembed"
        except Exception as e:
            if os.getenv('FLASK_ENV') == 'production':
                app.logger.warning(f"⚠️  Fastembed failed, falling back: {e}")
            else:
                app.logger.warning(f"⚠️  Fastembed failed, falling back: {e}")
    return create_sentence_transformer("BAAI/bge-base-en-v1.5", device=embedding_device), "sentence-transformers"


def create_mcq_embedding_model():
    """Create MCQ embedding model (defaults aligned with older working PYQ setup)."""
    provider = os.getenv("MCQ_EMBEDDING_PROVIDER", os.getenv("EMBEDDING_PROVIDER", "local")).strip().lower()
    local_model = os.getenv("MCQ_EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
    embedding_device = os.getenv("MCQ_EMBEDDING_DEVICE", os.getenv("EMBEDDING_DEVICE", "cpu"))

    # Keep legacy-friendly order for better PYQ match quality:
    # HF (optional) -> FastEmbed -> local sentence-transformers
    use_hf = os.getenv("USE_HF_EMBEDDINGS", "0").lower() in {"1", "true", "yes"}
    if use_hf:
        hf_token = os.getenv("HF_API_KEY")
        hf_model = os.getenv("HF_MCQ_EMBEDDING_MODEL", local_model)
        if not hf_token:
            raise RuntimeError("HF_API_KEY is required when USE_HF_EMBEDDINGS=1")
        return HFEmbeddingClient(hf_token, hf_model), "huggingface-mcq"

    use_fastembed = os.getenv("USE_FASTEMBED_FOR_MCQ", os.getenv("USE_FASTEMBED", "1")).lower() in {"1", "true", "yes"}
    if use_fastembed and TextEmbedding is not None:
        model_name = os.getenv("FASTEMBED_MCQ_MODEL", local_model)
        cache_path = os.getenv("FASTEMBED_CACHE_PATH", "/tmp/fastembed_cache")
        try:
            os.makedirs(cache_path, exist_ok=True)
            os.environ["FASTEMBED_CACHE_PATH"] = cache_path
            return TextEmbedding(model_name), "fastembed-mcq"
        except Exception as e:
            if os.getenv('FLASK_ENV') == 'production':
                app.logger.warning(f"⚠️  Fastembed MCQ model failed, falling back: {e}")
            else:
                app.logger.warning(f"⚠️  Fastembed MCQ model failed, falling back: {e}")

    if provider == "local":
        try:
            return create_sentence_transformer(local_model, device=embedding_device), "sentence-transformers-local-mcq"
        except Exception as e:
            if os.getenv('FLASK_ENV') == 'production':
                app.logger.warning(f"⚠️  Local MCQ embedding model failed, trying fallbacks: {e}")
            else:
                app.logger.warning(f"⚠️  Local MCQ embedding model failed, trying fallbacks: {e}")

    return create_sentence_transformer("BAAI/bge-small-en-v1.5", device=embedding_device), "sentence-transformers-mcq"


class HFEmbeddingClient:
    """Hugging Face Inference API client for embeddings (feature-extraction)."""
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        if InferenceClient is None:
            raise RuntimeError("huggingface_hub is required for HF embeddings")
        self.client = InferenceClient(api_key=self.api_key)

    def _fallback_feature_extraction(self, inputs):
        url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{self.model}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {"inputs": inputs}
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    def embed(self, texts):
        inputs = texts[0] if isinstance(texts, list) and len(texts) == 1 else texts
        last_error = None
        for attempt in range(3):
            try:
                # huggingface_hub API differs by version; prefer positional input
                data = self.client.feature_extraction(
                    inputs,
                    model=self.model,
                )
                break
            except TypeError:
                # Older/newer versions may require keyword-only input
                data = self.client.feature_extraction(
                    text=inputs,
                    model=self.model,
                )
                break
            except Exception as e:
                last_error = e
                time.sleep(0.6 * (attempt + 1))
        else:
            raise RuntimeError(f"HF embeddings failed after retries: {last_error}")

        if hasattr(data, "tolist"):
            data = data.tolist()

        def _has_data(obj):
            if obj is None:
                return False
            if hasattr(obj, "size"):
                return obj.size > 0
            try:
                return len(obj) > 0
            except Exception:
                return True

        if not _has_data(data):
            try:
                data = self._fallback_feature_extraction(inputs)
            except Exception as e:
                raise RuntimeError(f"HF embeddings returned empty vectors: {e}")

        # HF returns token embeddings; mean-pool to sentence embeddings
        def mean_pool(token_matrix):
            if token_matrix is None:
                return []
            if hasattr(token_matrix, "tolist"):
                token_matrix = token_matrix.tolist()
            if not token_matrix:
                return []
            dims = len(token_matrix[0])
            pooled = [0.0] * dims
            for token_vec in token_matrix:
                for i, v in enumerate(token_vec):
                    pooled[i] += float(v)
            count = float(len(token_matrix))
            return [v / count for v in pooled]

        if isinstance(data, list) and data and isinstance(data[0], list) and data and isinstance(data[0][0], list):
            return [mean_pool(item) for item in data]
        if isinstance(data, list) and data and isinstance(data[0], list):
            return [mean_pool(data)]
        if isinstance(data, list) and data and isinstance(data[0], (float, int)):
            return [list(map(float, data))]
        return []

def encode_texts(model, texts):
    """Encode texts to list of float vectors for either backend."""
    ttl_seconds = int(os.getenv("EMBEDDING_CACHE_TTL", "600"))
    cached_vectors = {}
    missing = []

    for text in texts:
        cache_key = f"embed:{hashlib.sha256(text.encode()).hexdigest()}"
        cached = _get_cached_value(cache_key)
        if cached is not None:
            cached_vectors[text] = cached
        else:
            missing.append((text, cache_key))

    if missing:
        to_encode = [text for text, _ in missing]

        def _normalize_vectors(raw_vectors):
            if raw_vectors is None:
                return []
            # If a single vector came back for a single input
            if isinstance(raw_vectors, list) and raw_vectors and isinstance(raw_vectors[0], (float, int)):
                return [list(map(float, raw_vectors))]
            normalized = []
            for vec in raw_vectors:
                if hasattr(vec, "tolist"):
                    normalized.append(vec.tolist())
                elif isinstance(vec, list):
                    normalized.append(list(map(float, vec)))
            return normalized

        if hasattr(model, "embed"):
            raw_vectors = model.embed(to_encode)
            new_vectors = _normalize_vectors(raw_vectors)
        else:
            try:
                encoded = model.encode(
                    to_encode,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
            except TypeError:
                encoded = model.encode(to_encode)
            new_vectors = _normalize_vectors(encoded)

        if not new_vectors or len(new_vectors) != len(to_encode):
            raise RuntimeError("Embedding backend returned no vectors")

        for (text, cache_key), vector in zip(missing, new_vectors):
            _set_cached_value(cache_key, vector, ttl_seconds)
            cached_vectors[text] = vector

    try:
        return [cached_vectors[text] for text in texts]
    except KeyError as e:
        raise RuntimeError(f"Missing embedding for text: {e}")

def encode_query(model, text: str):
    return encode_texts(model, [text])[0]


def _match_dimension_error(message: str):
    """Extract (query_dim, index_dim) from Pinecone dimension mismatch message."""
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
    """Resize embedding vector to target dimension by trim/pad."""
    if target_dim <= 0:
        return vector
    if len(vector) == target_dim:
        return vector
    if len(vector) > target_dim:
        return vector[:target_dim]
    return vector + [0.0] * (target_dim - len(vector))


def safe_pinecone_query(index, vector, **kwargs):
    """Query Pinecone and retry once with adjusted vector if dimensions mismatch."""
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


def _extract_index_dimension(stats):
    """Get Pinecone index dimension from stats object/dict."""
    if stats is None:
        return None
    if isinstance(stats, dict):
        dim = stats.get("dimension")
        return int(dim) if dim is not None else None
    dim = getattr(stats, "dimension", None)
    if dim is not None:
        return int(dim)
    to_dict = getattr(stats, "to_dict", None)
    if callable(to_dict):
        data = to_dict()
        if isinstance(data, dict) and data.get("dimension") is not None:
            return int(data.get("dimension"))
    return None


def encode_mcq_query(text: str):
    """Encode MCQ query using the shared embedding model."""
    mcq_model = search_components.get('mcq_model')
    if mcq_model is None:
        raise RuntimeError("MCQ model not initialized")
    return encode_query(mcq_model, text)


EDU_NAMESPACES = ["economics", "geography", "history", "polity"]
CLASS_OPTIONS = [
    {"value": "class-6", "label": "Class 6"},
    {"value": "class-7", "label": "Class 7"},
    {"value": "class-8", "label": "Class 8"},
    {"value": "class-9", "label": "Class 9"},
    {"value": "class-10", "label": "Class 10"},
    {"value": "class-11", "label": "Class 11"},
    {"value": "class-12", "label": "Class 12"},
]

ANSWER_LENGTH_PROFILES = {
    "very_short": {
        "label": "Very Short",
        "max_tokens": 340,
        "context_chars": 4500,
        "min_words": 75,
        "max_words": 135,
        "instruction": (
            "Provide a concise, student-friendly answer in 4-5 clear bullet points. "
            "Each bullet must be one complete sentence with exam-relevant facts. "
            "Keep language simple and high-yield for revision. "
            "No filler words. End with one short takeaway sentence."
        ),
        "format_hint": "4-5 bullets + one takeaway line"
    },
    "short": {
        "label": "Short",
        "max_tokens": 620,
        "context_chars": 9000,
        "min_words": 160,
        "max_words": 250,
        "instruction": (
            "Start with a 2-sentence overview in simple language. "
            "Then provide 5-6 detailed bullet points that a student can revise from quickly. "
            "Include key facts, terms, and one practical/example-based point where relevant. "
            "End with a 1-line exam takeaway."
        ),
        "format_hint": "2-line intro + 5-6 bullets + 1-line takeaway"
    },
    "normal": {
        "label": "Normal",
        "max_tokens": 1100,
        "context_chars": 12000,
        "min_words": 320,
        "max_words": 620,
        "instruction": (
            "Provide a well-structured, student-first explanation: "
            "1) Start with a clear 3-4 sentence introduction defining the topic and why it matters. "
            "2) Present 6-8 detailed bullet points covering core concepts, causes/effects, or features as relevant. "
            "3) Add one short example or context clue in at least 2 bullets when useful. "
            "4) End with a 'Key Takeaways' section of 2 concise lines for revision."
        ),
        "format_hint": "3-4 sentence intro + 6-8 bullets + Key Takeaways (2 lines)"
    },
    "explanatory": {
        "label": "Explanatory (Comprehensive)",
        "max_tokens": 2300,
        "context_chars": 19000,
        "min_words": 700,
        "max_words": 1700,
        "instruction": (
            "Provide a comprehensive, exam-oriented explanation in depth. "
            "Start with a clear 4-5 sentence introduction defining the topic, scope, and importance. "
            "Then explain major aspects in 10-14 detailed bullets, including definitions, mechanisms, chronology, and implications where relevant. "
            "Use concrete examples, dates, and factual anchors from context whenever available. "
            "Conclude with a brief 'Summary for Revision' section (3 lines) and an 'Exam Tip' line."
        ),
        "format_hint": "4-5 sentence intro + 10-14 detailed bullets + Summary for Revision (3 lines) + Exam Tip"
    },
}

_SENTENCE_END_RE = re.compile(r"([.!?])\s+")

def _trim_to_sentence_boundary(text: str) -> str:
    if not text:
        return text
    # Find last sentence-ending punctuation and trim after it
    matches = list(_SENTENCE_END_RE.finditer(text))
    if matches:
        end_idx = matches[-1].end()
        return text[:end_idx].strip()
    # If no sentence boundary, ensure it ends with a period
    text = text.strip()
    if text and text[-1] not in ".!?":
        return text + "."
    return text


def enforce_answer_length(text: str, answer_profile: dict) -> str:
    """Trim responses to avoid mid-sentence truncation and enforce max words."""
    if not text:
        return text
    max_words = answer_profile.get("max_words")
    if not max_words:
        return _trim_to_sentence_boundary(text)

    words = text.split()
    if len(words) <= max_words:
        return _trim_to_sentence_boundary(text)

    clipped = " ".join(words[:max_words]).strip()
    return _trim_to_sentence_boundary(clipped)


def normalize_answer_format(text: str) -> str:
    """Normalize model output into cleaner multiline markdown bullets."""
    if not text:
        return text

    normalized = str(text).replace("\r\n", "\n").strip()

    bullet_markers = re.findall(r"(?:\*|•)\s+", normalized)
    if len(bullet_markers) >= 2:
        # Convert inline star/dot bullets into newline bullets.
        normalized = re.sub(r"\s+(?:\*|•)\s+", "\n* ", normalized)
        # Convert leading star/dot bullets to markdown star bullets.
        normalized = re.sub(r"(?m)^\s*(?:\*|•)\s+", "* ", normalized)

    # Ensure bullet section starts on a fresh line after intro text.
    first_bullet_idx = normalized.find("* ")
    if first_bullet_idx > 0:
        prev_chunk = normalized[:first_bullet_idx].rstrip()
        if prev_chunk and not prev_chunk.endswith("\n\n"):
            normalized = prev_chunk + "\n\n" + normalized[first_bullet_idx:]

    # Collapse excessive blank lines.
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def normalize_class_label(class_label):
    """Normalize class label to (class_num, class_display, class_normalized)."""
    if not class_label:
        return None, None, None

    class_str = str(class_label).strip().upper()

    roman_to_num = {
        'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9,
        'X': 10, 'XI': 11, 'XII': 12
    }

    for roman, num in roman_to_num.items():
        if re.search(rf"\b{roman}\b", class_str):
            return num, f"Class {num}", f"class-{num}"

    digit_match = re.search(r"\b(6|7|8|9|10|11|12)\s*(?:ST|ND|RD|TH)?\b", class_str)
    if digit_match:
        class_num = int(digit_match.group(1))
        return class_num, f"Class {class_num}", f"class-{class_num}"

    return None, None, None


def extract_class_filter(user_query: str):
    """Extract class filter from query text."""
    if not user_query:
        return None

    query_lower = user_query.lower()
    class_patterns = [
        r"class\s*(\d+)",
        r"std\s*(\d+)",
        r"grade\s*(\d+)",
        r"(\d+)(?:st|nd|rd|th)\s*class",
        r"class\s*(vi|vii|viii|ix|x|xi|xii)",
    ]

    for pattern in class_patterns:
        match = re.search(pattern, query_lower)
        if not match:
            continue
        class_num, _, class_normalized = normalize_class_label(match.group(1))
        if class_num and 6 <= class_num <= 12:
            return class_normalized

    return None


def resolve_class_filter(selected_class, query):
    """Resolve class filter from selected value first, then query extraction."""
    if selected_class:
        _, _, normalized = normalize_class_label(selected_class)
        if normalized:
            return normalized

    return extract_class_filter(query)


def resolve_subject_namespace(selected_subject, explicit_namespace=""):
    """Resolve effective namespace from ask-bar subject or explicit namespace."""
    if explicit_namespace:
        ns = str(explicit_namespace).strip().lower()
        return ns if ns in EDU_NAMESPACES else ""

    subject_raw = str(selected_subject or "").strip().lower()
    if not subject_raw or subject_raw in {"all", "all subjects", "subject"}:
        return ""

    normalized = subject_raw.replace("ncert", "").strip()
    aliases = {
        "political science": "polity",
        "civics": "polity",
        "eco": "economics",
        "economy": "economics",
        "geo": "geography",
    }
    candidate = aliases.get(normalized, normalized)
    return candidate if candidate in EDU_NAMESPACES else ""


def filter_sources_by_score(sources, min_score):
    """Keep only sufficiently relevant sources based on similarity score."""
    filtered = []
    for source in sources or []:
        try:
            score = float(source.get('score', 0) or 0)
        except Exception:
            score = 0.0
        if score >= min_score:
            filtered.append(source)
    return filtered


def prepend_disclaimer(text, disclaimer):
    if not disclaimer:
        return text
    base = (text or "").strip()
    if not base:
        return f"⚠️ {disclaimer}"
    return f"⚠️ {disclaimer}\n\n{base}"


def sanitize_model_identity_text(text):
    """Remove model/provider self-identification from user-facing answers."""
    if not text:
        return text

    cleaned = re.sub(r"(?im)^.*\\b(chatgpt|openai)\\b.*\\n?", "", str(text)).strip()
    cleaned = re.sub(r"(?i)\\bi\\s+am\\s+chatgpt\\b", "I am your educational assistant", cleaned)
    cleaned = re.sub(r"(?i)\\bby\\s+openai\\b", "", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
    return cleaned


def query_source_overlap_count(query: str, source: dict) -> int:
    """Count meaningful keyword overlap between query and a source payload."""
    query_tokens = set(re.findall(r"[a-z0-9']+", str(query or "").lower()))
    if not query_tokens:
        return 0

    stop_words = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'what', 'why', 'how',
        'you', 'your', 'from', 'with', 'for', 'and', 'or', 'to', 'of', 'in',
        'on', 'this', 'that', 'these', 'those', 'about', 'can', 'could',
        'should', 'would', 'tell', 'me', 'explain', 'describe', 'difference'
    }
    query_keywords = {t for t in query_tokens if len(t) > 2 and t not in stop_words}
    if not query_keywords:
        return 0

    metadata = source.get('metadata', {}) if isinstance(source, dict) else {}
    source_text = " ".join([
        str(source.get('text_preview', '')),
        str(source.get('full_text', '')),
        str(source.get('subject', '')),
        str(source.get('chapter_name', '')),
        str(source.get('topic', '')),
        str(metadata.get('subject', '')),
        str(metadata.get('chapter_name', '')),
        str(metadata.get('topic', '')),
    ]).lower()

    if not source_text.strip():
        return 0

    source_tokens = set(re.findall(r"[a-z0-9']+", source_text))
    return len(query_keywords.intersection(source_tokens))


def get_answer_length_profile(answer_length_mode):
    mode = str(answer_length_mode or "normal").strip().lower().replace("-", "_").replace(" ", "_")
    return ANSWER_LENGTH_PROFILES.get(mode, ANSWER_LENGTH_PROFILES["normal"]), mode if mode in ANSWER_LENGTH_PROFILES else "normal"


def trim_context_from_sources(sources, max_chars):
    """Build compact context under a char budget to control token usage safely."""
    selected_blocks = []
    total_chars = 0

    for idx, source in enumerate(sources, 1):
        metadata = source.get('metadata', {}) if isinstance(source, dict) else {}
        content = (
            metadata.get('content')
            or metadata.get('text')
            or source.get('full_text')
            or source.get('text_preview')
            or ""
        )
        if not content:
            continue

        content = str(content).strip()
        if not content:
            continue

        content_budget = min(1800, max(300, max_chars // 3))
        clipped = content[:content_budget]
        block = (
            f"[Source {idx}] "
            f"Subject: {metadata.get('subject', source.get('subject', ''))} | "
            f"Class: {metadata.get('class', source.get('class', ''))} | "
            f"Chapter: {metadata.get('chapter', source.get('chapter', ''))}\n"
            f"{clipped}"
        )

        projected = total_chars + len(block) + 2
        if projected > max_chars and selected_blocks:
            break
        selected_blocks.append(block)
        total_chars = projected

    return "\n\n".join(selected_blocks)


def is_greeting_or_casual(query: str) -> tuple[bool, str, str]:
    """Robustly detect greeting/casual/meta queries and return (matched, response, intent_label)."""
    query_lower = query.lower().strip()
    tokens = re.findall(r"[a-z0-9']+", query_lower)
    token_set = set(tokens)
    word_count = len(tokens)

    if not query_lower:
        return False, "", "academic_query"

    academic_terms = {
        'polity', 'history', 'geography', 'economics', 'science', 'math', 'physics',
        'chemistry', 'biology', 'constitution', 'democracy', 'photosynthesis',
        'chapter', 'class', 'ncert', 'exam', 'pyq', 'syllabus', 'topic', 'resource'
    }

    provider_terms = {
        'chatgpt', 'openai', 'gpt', 'gemini', 'claude', 'copilot', 'groq',
        'llama', 'model', 'ai', 'assistant', 'bot'
    }

    has_provider_term = any(term in token_set for term in provider_terms)
    has_academic_term = any(term in token_set for term in academic_terms)

    # ---- 1) Meta identity/provider/comparison intent (highest priority) ----
    identity_patterns = [
        r"\bwho\s+are\s+you\b", r"\bwhat\s+are\s+you\b",
        r"\bwhat\s+is\s+your\s+name\b", r"\bwhats\s+your\s+name\b",
        r"\bwho\s+(made|created|built|developed)\s+you\b",
        r"\bwhat\s+can\s+you\s+do\b", r"\bwhat\s+do\s+you\s+do\b",
        r"\baap\s+kaun\s+ho\b", r"\btum\s+kaun\s+ho\b",
        r"\bnaam\s+kya\s+hai\b",
        r"\bkisne\s+banaya\b", r"\bkisne\s+banaya\s+tumhe\b"
    ]

    comparison_patterns = [
        r"\bdifference\b.*\b(chatgpt|openai|gpt|gemini|claude|copilot|ai)\b",
        r"\bdifferent\b.*\b(chatgpt|openai|gpt|gemini|claude|copilot|ai)\b",
        r"\bhow\s+are\s+you\s+different\b",
        r"\bhow\s+are\s+you\s+better\b",
        r"\bbetter\s+than\b.*\b(chatgpt|openai|gpt|gemini|claude|copilot|ai)\b",
        r"\bgeneral\s*[- ]?purpose\s+ai\b",
        r"\bcompare\b.*\b(chatgpt|openai|gpt|gemini|claude|copilot|ai)\b",
        r"\bvs\b\s*(chatgpt|openai|gpt|gemini|claude|copilot|ai)\b",
        r"\bversus\b\s*(chatgpt|openai|gpt|gemini|claude|copilot|ai)\b",
    ]

    provider_identity_patterns = [
        r"\bare\s+you\s+ai\b",
        r"\byou\s+are\s+ai\b",
        r"\byou\s+are\s+an\s+ai\b",
        r"\byou'?re\s+ai\b",
        r"\byou\s+are\s+not\s+human\b",
        r"\byou\s+are\s+ai\s+not\s+human\b",
        r"\bare\s+you\s+(open\s*ai|openai|chatgpt|gpt|groq|llama)\b",
        r"\byou\s+are\s+(open\s*ai|openai|chatgpt)\b",
        r"\bwhich\s+model\s+are\s+you\b",
        r"\bwhat\s+model\s+are\s+you\b",
        r"\bwhich\s+ai\s+model\b",
        r"\bmodel\s+name\b",
    ]

    meta_pronouns = {'you', 'your', 'u', 'tum', 'aap'}
    looks_like_short_meta_assertion = (
        word_count <= 10
        and not has_academic_term
        and (has_provider_term or 'human' in token_set)
        and bool(token_set.intersection(meta_pronouns))
    )

    matched_identity = any(re.search(pattern, query_lower) for pattern in identity_patterns)
    matched_provider_identity = any(re.search(pattern, query_lower) for pattern in provider_identity_patterns)
    matched_comparison = any(re.search(pattern, query_lower) for pattern in comparison_patterns)

    comparison_intent = (
        matched_comparison
        or (
            has_provider_term
            and ('you' in token_set or 'your' in token_set)
            and any(word in token_set for word in {'better', 'difference', 'different', 'compare', 'vs', 'versus'})
        )
    )

    if matched_identity or matched_provider_identity or looks_like_short_meta_assertion or comparison_intent:
        if comparison_intent:
            return True, (
                "Good question. General-purpose AI can be better for broad/open-ended tasks.\n\n"
                "Where **Pratiyogita Gyan** is better for exam prep:\n"
                "• More syllabus-focused (NCERT + PYQ style)\n"
                "• More concise exam-oriented explanations\n"
                "• Better class/subject-filtered guidance\n"
                "• Less generic detours in study answers\n\n"
                "Where general-purpose AI can be better:\n"
                "• Creative writing and non-academic conversation\n"
                "• Wider general-topic exploration\n\n"
                "For serious exam revision, use me as your primary tool and cross-check key facts when needed."
            ), "meta_comparison"

        return True, (
            "Yes — I am an AI assistant.\n\n"
            "I’m **Pratiyogita Gyan** 🎓, built specifically for NCERT and exam preparation.\n\n"
            "I’m strongest at:\n"
            "• NCERT concept explanations\n"
            "• PYQ-focused practice help\n"
            "• Class-wise exam revision guidance\n\n"
            "I avoid unrelated general-chat content and stay focused on syllabus-oriented answers."
        ), "meta_identity"

    # ---- 2) Greetings / casual (conservative rules only) ----
    greeting_phrases = {
        'hi', 'hello', 'hey', 'hii', 'heya', 'howdy',
        'good morning', 'good afternoon', 'good evening', 'good night',
        'namaste', 'namaskar', 'pranam', 'ram ram', 'salaam', 'adaab'
    }

    if word_count <= 5 and not has_academic_term:
        if query_lower in greeting_phrases or any(query_lower.startswith(f"{g} ") for g in greeting_phrases):
            return True, (
                "Hello! 👋 I'm **Pratiyogita Gyan**, your NCERT learning assistant.\n\n"
                "I can help with concepts, PYQs, and exam preparation.\n"
                "What would you like to learn today?"
            ), "greeting"

    casual_patterns = [
        r"\bhow\s+are\s+you\b", r"\bhow\s+r\s+u\b", r"\bhow\s+you\s+doing\b",
        r"\bwhat'?s\s+up\b", r"\bwhats\s+up\b", r"\bwassup\b", r"\bsup\b",
        r"\bkaise\s+ho\b", r"\bkese\s+ho\b", r"\bkya\s+hal\s+hai\b"
    ]
    if word_count <= 8 and not has_academic_term and any(re.search(p, query_lower) for p in casual_patterns):
        return True, (
            "I'm doing great, thanks! 😊\n\n"
            "Ready to help with NCERT concepts, PYQs, and exam prep.\n"
            "Which topic should we start with?"
        ), "casual_chat"

    # ---- 3) Thank-you intent (strict token-level to avoid 'polity' -> 'ty') ----
    thank_tokens = {'thanks', 'thnx', 'ty', 'thanku', 'shukriya', 'dhanyavaad', 'dhanyawad'}
    thank_phrase_match = re.search(r"\bthank\s*(you|u)?\b", query_lower) is not None
    is_short_ack = word_count <= 4 and (
        thank_phrase_match or any(tok in token_set for tok in thank_tokens)
    )

    if is_short_ack and not has_academic_term:
        return True, (
            "You're welcome! 😊\n\n"
            "Ask me any topic from NCERT or PYQ practice whenever you're ready."
        ), "gratitude"

    # ---- 4) Very short non-educational filler ----
    casual_interjections = {'ok', 'okay', 'hmm', 'oh', 'wow', 'nice', 'cool', 'great', 'acha', 'accha'}
    if word_count <= 2 and token_set.intersection(casual_interjections) and not has_academic_term:
        return True, (
            "I'm here to help you study! 📖\n\n"
            "Ask a topic like: 'Explain federalism', 'What is polity?', or 'PYQ on Constitution'."
        ), "casual_short"

    return False, "", "academic_query"


def build_generation_prompt(context: str, query: str, answer_profile: dict, answer_mode: str = "normal", best_match_score: float = 0.0, source_metadata: dict = None):
    """Create compact, completion-safe prompt for accurate educational answers with clarity checks."""
    
    # Detect unclear/short queries with low match quality
    query_words = query.strip().split()
    is_very_short = len(query_words) <= 2
    is_low_quality = best_match_score > 0 and best_match_score < 0.4
    
    # Extract topic for intelligent guessing
    likely_topic = ""
    if source_metadata:
        likely_topic = source_metadata.get('topic', '') or source_metadata.get('chapter_name', '')
    
    # For unclear queries, use a completely different prompt format
    if is_very_short and is_low_quality and likely_topic:
        return (
            "You are a helpful NCERT learning assistant. The user's query appears to have typos or is unclear.\n\n"
            f"User Query: '{query}' (appears to be a typo)\n"
            f"Most Relevant Topic Found: '{likely_topic}'\n\n"
            "INSTRUCTIONS - Follow this EXACT format:\n\n"
            "Line 1: 🤔 I noticed your query \"{query}\" might have a typo. Did you mean \"{topic}\"?\n\n"
            "Line 2-4: [Provide a brief 2-3 sentence answer about {topic} based on the context below]\n\n"
            "Last line: If this isn't what you're looking for, please rephrase your question.\n\n"
            f"Context:\n{context if context else 'No context available.'}\n\n"
            "Generate response now:"
        ).format(query=query, topic=likely_topic)
    
    # For very low quality matches without clear topic
    elif is_very_short and is_low_quality:
        return (
            "You are a helpful NCERT learning assistant. The user's query is unclear.\n\n"
            f"User Query: '{query}'\n\n"
            "INSTRUCTIONS - Follow this EXACT format:\n\n"
            "🤔 Your query \"{query}\" is too short or unclear. Please provide more details so I can help you better.\n\n"
            "For example:\n"
            "- What specific topic are you asking about?\n"
            "- Which subject or chapter?\n"
            "- Can you rephrase with a complete question?\n\n"
            "Generate response now:"
        ).format(query=query)
    
    # Standard prompt for clear queries
    context_warning = ""
    if best_match_score > 0 and best_match_score < 0.3:
        context_warning = f"\n⚠️ Note: Context relevance is low ({best_match_score:.1%}). Answer may not be fully accurate.\n\n"
    
    min_words = answer_profile.get("min_words")
    max_words = answer_profile.get("max_words")
    word_target = ""
    if min_words and max_words:
        word_target = f"Target length: {min_words}-{max_words} words."

    format_hint = answer_profile.get("format_hint", "")
    format_line = f"Format: {format_hint}." if format_hint else ""

    mode_contracts = {
        "very_short": (
            "Output contract for very_short:\n"
            "- No heading.\n"
            "- Return 4-5 bullets only.\n"
            "- Each bullet one sentence, high signal, exam-focused.\n"
            "- End with one short takeaway sentence.\n"
            "- Keep total within 75-135 words."
        ),
        "short": (
            "Output contract for short:\n"
            "- Start with exactly 2 intro sentences.\n"
            "- Then return 5-6 bullets.\n"
            "- End with one takeaway line.\n"
            "- Keep total within 160-250 words."
        ),
        "normal": (
            "Output contract for normal:\n"
            "- Start with 1 compact intro paragraph (3-4 sentences).\n"
            "- Then return 6-8 bullets with clear detail and examples where relevant.\n"
            "- End with '**Key Takeaways**' and exactly 2 short lines.\n"
            "- Keep total within 320-620 words."
        ),
        "explanatory": (
            "Output contract for explanatory:\n"
            "- Start with a fuller intro paragraph (4-5 sentences).\n"
            "- Then return 10-14 detailed bullets (concept + example/use-case).\n"
            "- End with '**Summary for Revision**' and exactly 3 lines, then one '**Exam Tip**' line.\n"
            "- Keep total within 700-1700 words."
        ),
    }
    mode_contract = mode_contracts.get(answer_mode, mode_contracts["normal"])

    formatting_rules = (
        "Formatting rules (must follow):\n"
        "1) Follow the output contract for the selected mode exactly.\n"
        "2) If using bullets, each bullet must be on a new line starting with '- '.\n"
        "4) Never write malformed headings like '*Introduction'. If headings are used, write them as bold markdown like '**Introduction**'.\n"
        "5) Keep a blank line between sections and keep the answer readable."
    )

    return (
        "You are an expert NCERT learning assistant. "
        "Use the provided context as the primary source of truth. "
        "Be direct, accurate, and student-friendly. "
        "Prioritize clarity, exam relevance, and revision usefulness. "
        "Never fabricate citations. "
        "Never mention model/provider names (e.g., ChatGPT, OpenAI, Groq). "
        "Do not exceed the word limit and end with a complete sentence.\n\n"
        f"Selected answer mode: {answer_mode}\n"
        f"Answer style: {answer_profile['instruction']}\n"
        f"{word_target}\n"
        f"{format_line}\n\n"
        f"{mode_contract}\n\n"
        f"{formatting_rules}\n\n"
        f"Question:\n{query}\n\n"
        f"{context_warning}"
        f"Context:\n{context if context else 'No relevant context retrieved.'}\n\n"
        "Provide the final answer now."
    )
    


def _answer_word_count(text: str) -> int:
    return len(re.findall(r"[a-zA-Z0-9']+", str(text or "")))


def _needs_answer_expansion(text: str, answer_profile: dict) -> bool:
    min_words = int(answer_profile.get("min_words") or 0)
    if min_words <= 0:
        return False
    soft_floor = max(40, int(min_words * 0.82))
    return _answer_word_count(text) < soft_floor


def _build_expansion_prompt(query: str, draft: str, answer_mode: str, answer_profile: dict) -> str:
    min_words = int(answer_profile.get("min_words") or 0)
    max_words = int(answer_profile.get("max_words") or 0)
    range_hint = f"{min_words}-{max_words}" if min_words and max_words else "the required"
    return (
        "Improve and expand the draft answer for students while keeping facts aligned with the original draft and context.\n"
        f"Mode: {answer_mode}\n"
        f"Target word range: {range_hint} words.\n"
        "Requirements:\n"
        "- Keep structure readable and exam-oriented.\n"
        "- Keep all key facts from draft; add missing clarity and context.\n"
        "- Include the required takeaway/summary section for this mode.\n"
        "- No provider/model mentions.\n\n"
        f"Question:\n{query}\n\n"
        f"Draft Answer:\n{draft}\n\n"
        "Return only the improved final answer."
    )


def generate_with_model_routing(query: str, context: str, answer_profile: dict, answer_mode: str = "normal", llm_temperature: float = 0.3, llm_top_p: float = 0.9, llm_max_tokens: int = 750, best_match_score: float = 0.0, source_metadata: dict = None):
    """Generate answer with provider routing: OpenAI (primary) -> Groq (fallback)."""
    prompt = build_generation_prompt(context, query, answer_profile, answer_mode, best_match_score, source_metadata)
    max_tokens = min(llm_max_tokens, answer_profile['max_tokens'])

    # 1) Primary: OpenAI
    openai_client = search_components.get('openai_client')
    if openai_client:
        try:
            response = openai_client.chat.completions.create(
                model=search_components.get('openai_model', 'gpt-4o-mini'),
                messages=[
                    {"role": "system", "content": "You are a precise and helpful educational assistant."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=max_tokens,
                temperature=llm_temperature,
                top_p=llm_top_p,
                timeout=int(os.getenv('OPENAI_TIMEOUT_SECONDS', '20')),
            )
            content = (response.choices[0].message.content or "").strip()
            if content:
                if _needs_answer_expansion(content, answer_profile):
                    try:
                        refine = openai_client.chat.completions.create(
                            model=search_components.get('openai_model', 'gpt-4o-mini'),
                            messages=[
                                {"role": "system", "content": "You are a precise and helpful educational assistant."},
                                {"role": "user", "content": _build_expansion_prompt(query, content, answer_mode, answer_profile)},
                            ],
                            max_tokens=max_tokens,
                            temperature=min(llm_temperature, 0.25),
                            top_p=llm_top_p,
                            timeout=int(os.getenv('OPENAI_TIMEOUT_SECONDS', '20')),
                        )
                        refined_content = (refine.choices[0].message.content or "").strip()
                        if refined_content:
                            content = refined_content
                    except Exception:
                        pass
                return content, "openai", None
        except Exception as e:
            app.logger.warning(f"OpenAI generation failed, trying fallback: {e}")

    # 2) Fallback: Groq
    groq_client = search_components.get('client')
    if groq_client:
        try:
            response = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a precise and helpful educational assistant."},
                    {"role": "user", "content": prompt},
                ],
                model=search_components.get('groq_model', os.getenv('GROQ_MODEL_NAME', 'llama-3.1-8b-instant')),
                max_tokens=max_tokens,
                temperature=llm_temperature,
                top_p=llm_top_p,
            )
            content = (response.choices[0].message.content or "").strip()
            if content:
                if _needs_answer_expansion(content, answer_profile):
                    try:
                        refine = groq_client.chat.completions.create(
                            messages=[
                                {"role": "system", "content": "You are a precise and helpful educational assistant."},
                                {"role": "user", "content": _build_expansion_prompt(query, content, answer_mode, answer_profile)},
                            ],
                            model=search_components.get('groq_model', os.getenv('GROQ_MODEL_NAME', 'llama-3.1-8b-instant')),
                            max_tokens=max_tokens,
                            temperature=min(llm_temperature, 0.25),
                            top_p=llm_top_p,
                        )
                        refined_content = (refine.choices[0].message.content or "").strip()
                        if refined_content:
                            content = refined_content
                    except Exception:
                        pass
                return content, "groq", None
        except Exception as e:
            return None, None, f"All LLM providers failed: {e}"

    return None, None, "No LLM provider configured"

def initialize_search_system():
    """Initialize all components needed for search"""
    global search_components, system_initialized
    
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    try:
        if is_production:
            app.logger.info("🔧 Initializing search system...")
        else:
            print("🔧 Initializing search system...")
        
        # Load API keys
        openai_api_key, groq_api_key, pine_api_key = load_api_keys()
        
        # Initialize components only if API keys are available
        if pine_api_key:
            try:
                # Initialize Pinecone for RAG
                pc_rag = Pinecone(api_key=pine_api_key)
                rag_index_name = os.getenv("RAG_INDEX_NAME", "ncert-local-bge-base")
                rag_index = pc_rag.Index(rag_index_name)
                rag_model, embedding_backend = create_embedding_model()
                
                # Initialize Pinecone for MCQ - use same BGE-base model for consistency and quality
                pc_mcq = Pinecone(api_key=pine_api_key)
                mcq_index_name = os.getenv('MCQ_INDEX_NAME', 'pyq-bge-768')
                mcq_index = pc_mcq.Index(mcq_index_name)
                # Use same model as RAG for unified architecture (BGE-base, 768-dim)
                mcq_model = rag_model
                
                # Verify MCQ model dimension by encoding a test query
                test_embedding = encode_query(mcq_model, "test")
                mcq_actual_dim = len(test_embedding)

                if is_production:
                    app.logger.info(f"✅ RAG embedding backend: {embedding_backend}")
                    app.logger.info(f"✅ MCQ embedding model: BGE-base (shared with RAG)")
                    app.logger.info(f"✅ MCQ embedding dimension: {mcq_actual_dim} (expected: 768)")
                    if mcq_actual_dim != 768:
                        app.logger.error(f"❌ CRITICAL: MCQ dimension mismatch! Got {mcq_actual_dim}, expected 768")
                else:
                    print(f"✅ RAG embedding backend: {embedding_backend}")
                    print(f"✅ MCQ embedding model: BGE-base (shared with RAG)")
                    print(f"✅ MCQ embedding dimension: {mcq_actual_dim} (expected: 768)")
                    if mcq_actual_dim != 768:
                        print(f"❌ CRITICAL: MCQ dimension mismatch! Got {mcq_actual_dim}, expected 768")
                
                search_components['rag_index'] = rag_index
                search_components['rag_model'] = rag_model
                search_components['rag_index_name'] = rag_index_name
                search_components['mcq_index'] = mcq_index
                search_components['mcq_model'] = mcq_model
                
                if is_production:
                    app.logger.info("✅ Pinecone components initialized")
                else:
                    print("✅ Pinecone components initialized")
            except Exception as e:
                error_msg = f"⚠️  Failed to initialize Pinecone: {str(e)}"
                if is_production:
                    app.logger.warning(error_msg)
                else:
                    print(error_msg)
        
        # Initialize OpenAI primary client
        if openai_api_key and OpenAI is not None:
            try:
                openai_timeout = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "20"))
                search_components['openai_client'] = OpenAI(api_key=openai_api_key, timeout=openai_timeout)
                search_components['openai_model'] = os.getenv('OPENAI_MODEL_NAME', 'gpt-4o-mini')
                if is_production:
                    app.logger.info("✅ OpenAI client initialized")
                else:
                    print("✅ OpenAI client initialized")
            except Exception as e:
                error_msg = f"⚠️  Failed to initialize OpenAI client: {str(e)}"
                if is_production:
                    app.logger.warning(error_msg)
                else:
                    print(error_msg)

        # Initialize Groq fallback client
        if groq_api_key:
            try:
                client = Groq(api_key=groq_api_key)
                search_components['client'] = client
                search_components['groq_model'] = os.getenv('GROQ_MODEL_NAME', 'llama-3.1-8b-instant')
                
                if is_production:
                    app.logger.info("✅ Groq client initialized")
                else:
                    print("✅ Groq client initialized")
            except Exception as e:
                error_msg = f"⚠️  Failed to initialize Groq: {str(e)}"
                if is_production:
                    app.logger.warning(error_msg)
                else:
                    print(error_msg)
        
        system_initialized = True
        success_msg = "✅ Search system initialized successfully"
        if is_production:
            app.logger.info(success_msg)
        else:
            print(success_msg)
        return True
    except Exception as e:
        error_msg = f"❌ Failed to initialize search system: {str(e)}"
        if is_production:
            app.logger.error(error_msg)
        else:
            print(error_msg)
        system_initialized = True  # Still mark as initialized to allow API endpoints to work
        return False

def ensure_initialized():
    """Initialize the search system once (safe under Gunicorn)."""
    global system_initialized
    if system_initialized:
        return
    with _init_lock:
        if not system_initialized:
            initialize_search_system()

@app.before_request
def _initialize_on_first_request():
    ensure_initialized()

# Search functions (adapted from search_query.py)
def semantic_search(index, model, query: str, n_results: int = 2, namespace: str = "", query_embedding=None):
    """Perform semantic search on Pinecone index"""
    if query_embedding is None:
        query_embedding = encode_query(model, query)
    
    if namespace:
        results = index.query(
            vector=query_embedding,
            top_k=n_results,
            include_metadata=True,
            namespace=namespace
        )
    else:
        results = index.query(
            vector=query_embedding,
            top_k=n_results,
            include_metadata=True
        )
    return results

def get_context_with_sources(results):
    """Extract context and sources from search results with improved formatting"""
    # Create structured context with clear separation and relevance indicators
    context_parts = []
    sources = []
    
    for i, match in enumerate(results['matches'], 1):
        metadata = match.get('metadata', {})
        text_content = metadata.get('content', metadata.get('text', metadata.get('question', '')))
        score = match.get('score', 0)
        
        # Add context with relevance indicator
        context_parts.append(f"[Source {i} - Relevance: {score:.2f}]\n{text_content}")
        
        # Prepare source information with rich metadata
        source_info = {
            'source': metadata.get('source', 'Unknown'),
            'chunk': metadata.get('chunk', 'Unknown'),
            'score': round(score, 3),
            'text_preview': text_content[:200] + "..." if len(text_content) > 200 else text_content,
            'full_text': text_content,
            # Add hierarchical metadata
            'subject': metadata.get('subject', ''),
            'class': metadata.get('class', ''),
            'unit': metadata.get('unit', ''),
            'chapter': metadata.get('chapter', ''),
            'chapter_name': metadata.get('chapter_name', ''),
            'topic': metadata.get('topic', ''),
            'hierarchy': metadata.get('hierarchy', ''),
            'content': metadata.get('content', text_content)
        }
        sources.append(source_info)
    
    # Join context with clear separators
    context = "\n\n" + "="*50 + "\n\n".join(context_parts) + "\n" + "="*50
    
    return context, sources

def get_prompt(context: str, query: str):
    """Generate enhanced prompt for LLM with better instruction clarity"""
    
    # Check if context seems relevant
    context_quality = "high" if len(context.strip()) > 200 else "limited"
    
    if context_quality == "limited":
        prompt = f"""You are an intelligent educational assistant specializing in NCERT content and competitive exam preparation.

**Current Situation:** The available context is limited, but you should still try to provide helpful educational guidance.

**Instructions:**
1. Review the available context carefully for any relevant information
2. Provide the best educational response possible based on what's available
3. If the context has some relevant information, expand on it with your educational knowledge
4. Structure your response clearly and make it educational
5. If the context is truly empty or completely unrelated, acknowledge this and provide general guidance on the topic if possible

**Available Context:**
{context}

**Student Question:** {query}

**Educational Response:** Based on the available information and educational best practices, let me help you with this question."""
    else:
        prompt = f"""You are an intelligent educational assistant specializing in NCERT content and competitive exam preparation. Your task is to provide comprehensive, accurate, and helpful responses based on the provided context.

**Instructions:**
1. Use the provided context as your primary source of information
2. Provide a detailed and comprehensive answer based on the context
3. Structure your response clearly with proper formatting
4. Include specific details, examples, and explanations from the context
5. Make your response educational and easy to understand
6. If the context only partially answers the question, provide what information you can
7. Always aim to be helpful and educational

**Context from Educational Documents:**
{context}

**Student Question:** {query}

**Educational Response:**"""
    
    return prompt

def build_fallback_response(context: str, sources: list, query: str) -> str:
    """Build a helpful fallback response when LLM is unavailable"""
    if sources:
        bullets = []
        for i, source in enumerate(sources, 1):
            preview = source.get('text_preview') or source.get('full_text') or ''
            subject = source.get('subject', '')
            chapter = source.get('chapter', '')
            if preview:
                header = f"**Source {i}**"
                if subject:
                    header += f" - {subject}"
                if chapter:
                    header += f" (Chapter: {chapter})"
                bullets.append(f"{header}\n{preview[:400]}...")
        
        if bullets:
            return (
                "⚠️ **AI service temporarily unavailable**\n\n"
                "However, I found relevant information from NCERT materials:\n\n"
                + "\n\n---\n\n".join(bullets) + 
                "\n\n---\n\n📚 *Tip: The AI will provide a more comprehensive answer when the service is restored.*"
            )
    
    if context and context.strip():
        return (
            "⚠️ **AI service temporarily unavailable**\n\n"
            "Here's the relevant context from NCERT materials:\n\n"
            f"{context.strip()[:1000]}\n\n"
            "📚 *For a detailed explanation, please try again in a moment.*"
        )
    
    # No context found at all
    return (
        "⚠️ **Unable to process your request**\n\n"
        "I couldn't find relevant NCERT content for your query, and the AI service is temporarily unavailable.\n\n"
        "**Suggestions:**\n"
        "• Try rephrasing your question\n"
        "• Specify the subject or class (e.g., 'Class 10 democracy')\n"
        "• Ask about specific NCERT topics\n"
        "• Try again in a few moments\n\n"
        "**Example queries:**\n"
        "• 'Explain federalism in India'\n"
        "• 'What is photosynthesis?'\n"
        "• 'PYQ on Indian Constitution'"
    )

@app.route("/api/health", methods=["GET"])
def health_check():
    """Enhanced health check endpoint"""
    if not system_initialized:
        ensure_initialized()
    health_status = {
        "status": "healthy",
        "system_initialized": system_initialized,
        "timestamp": time.time(),
        "version": "1.0.0"
    }
    
    # Check individual components
    components = {}
    
    if system_initialized:
        try:
            # Check Pinecone connection
            if 'rag_index' in search_components:
                rag_stats = _get_index_stats_cached(search_components['rag_index'], 'rag_index_stats', ttl_seconds=60)
                components['rag_index'] = {
                    "status": "healthy",
                    "total_vectors": rag_stats.total_vector_count
                }
            
            if 'mcq_index' in search_components:
                mcq_stats = _get_index_stats_cached(search_components['mcq_index'], 'mcq_index_stats', ttl_seconds=60)
                components['mcq_index'] = {
                    "status": "healthy", 
                    "total_vectors": mcq_stats.total_vector_count
                }
            
            # Check models
            if 'rag_model' in search_components:
                components['rag_model'] = {"status": "healthy"}
            if 'mcq_model' in search_components:
                components['mcq_model'] = {"status": "healthy"}
            if 'openai_client' in search_components:
                components['openai_client'] = {"status": "healthy"}
            else:
                components['openai_client'] = {"status": "unavailable"}
            if 'client' in search_components:
                components['groq_client'] = {"status": "healthy"}
            else:
                components['groq_client'] = {"status": "unavailable"}

            if 'openai_client' not in search_components and 'client' not in search_components:
                health_status["status"] = "degraded"
                
        except Exception as e:
            health_status["status"] = "degraded"
            health_status["error"] = str(e)
    else:
        health_status["status"] = "initializing"
    
    health_status["components"] = components
    
    status_code = 200 if health_status["status"] == "healthy" else 503
    return jsonify(health_status), status_code

@app.route("/api/search", methods=["POST"])
@rate_limit(max_requests=20, window_seconds=60)
def search():
    """Handle search queries - return RAG response and related MCQs separately"""
    global search_components
    
    if not system_initialized:
        return jsonify({
            "error": "Search system not initialized",
            "message": "Backend is starting up or API keys are not configured. Please check server logs."
        }), 500
    
    # Pinecone is optional for a best-effort response
    pinecone_available = 'rag_index' in search_components and 'rag_model' in search_components
    request_id = uuid.uuid4().hex[:12]
    start_time = time.time()
    
    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    
    # Input validation
    query = str(data.get("query", "")).strip()
    if not query:
        return jsonify({"error": "Query cannot be empty"}), 400
    if len(query) > 1000:
        return jsonify({"error": "Query too long (max 1000 characters)"}), 400
    
    n_results = safe_int(
        data.get("n_results", os.getenv("DEFAULT_N_RESULTS", "5")),
        default=5,
        min_value=1,
        max_value=20,
    )
    
    # Handle namespace - frontend sometimes sends dict instead of string
    namespace_raw = data.get("namespace", "")
    if isinstance(namespace_raw, dict):
        # Frontend sent dict, extract subject field or default to empty string
        namespace = ""
        if DEBUG_MODE:
            print(f"WARNING: Frontend sent dict for namespace: {namespace_raw}, using empty string")
    else:
        namespace = namespace_raw if isinstance(namespace_raw, str) else ""
    
    selected_class = data.get("selected_class")
    selected_subject = data.get("subject", "all")
    answer_length = data.get("answer_length", "normal")
    mcq_threshold = safe_float(
        data.get("mcq_threshold", os.getenv("DEFAULT_MCQ_THRESHOLD", "0.25")),
        default=0.25,
        min_value=0.0,
        max_value=1.0,
    )
    mcq_limit = safe_int(
        data.get("mcq_limit", os.getenv("DEFAULT_MCQ_LIMIT", "0")),
        default=0,
        min_value=0,
        max_value=100,
    )
    answer_settings = data.get("answer_settings", {}) or {}

    answer_profile, resolved_answer_length = get_answer_length_profile(answer_length)
    llm_temperature = safe_float(
        answer_settings.get("temperature", os.getenv("DEFAULT_ANSWER_TEMPERATURE", "0.3")),
        default=0.3,
        min_value=0.0,
        max_value=1.0,
    )
    llm_top_p = safe_float(
        answer_settings.get("top_p", os.getenv("DEFAULT_ANSWER_TOP_P", "0.9")),
        default=0.9,
        min_value=0.0,
        max_value=1.0,
    )
    # Enforce profile-specific token limits regardless of client overrides
    llm_max_tokens = answer_profile["max_tokens"]
    
    try:
        # Track routing decisions for observability
        decision_path = []

        # Check for greetings or casual/meta chat first
        is_casual, casual_response, intent_label = is_greeting_or_casual(query)
        decision_path.append(f"intent:{intent_label}")
        if is_casual:
            app.logger.info(
                "search_decision request_id=%s intent=%s provider=%s namespace=%s class=%s sources=%s",
                request_id,
                intent_label,
                "greeting_handler",
                "none",
                None,
                0,
            )
            return jsonify({
                "rag_response": casual_response,
                "sources": [],
                "mcq_results": [],
                "query": query,
                "namespace_used": "none",
                "class_filter_used": None,
                "answer_length_mode": "normal",
                "provider_used": "greeting_handler",
                "is_greeting": True
                ,"intent": intent_label,
                "decision_path": decision_path,
                "best_score": 0.0,
                "request_id": request_id,
                "elapsed_ms": int((time.time() - start_time) * 1000),
            }), 200

        # Set a timeout for the entire operation
        timeout_seconds = 30  # 30 second timeout

        if pinecone_available:
            # Precompute embedding once for RAG searches
            rag_query_embedding = encode_query(search_components['rag_model'], query)
        else:
            rag_query_embedding = None

        resolved_class_filter = resolve_class_filter(selected_class, query)
        effective_namespace = resolve_subject_namespace(selected_subject, namespace)
        strict_subject_selected = bool(effective_namespace)
        strict_class_selected = bool(resolved_class_filter)
        decision_path.append(f"subject_ns:{effective_namespace or 'all'}")
        decision_path.append(f"class_filter:{resolved_class_filter or 'none'}")
        decision_path.append(f"strict_subject:{strict_subject_selected}")
        decision_path.append(f"strict_class:{strict_class_selected}")

        min_source_score = float(os.getenv("MIN_RAG_SOURCE_SCORE", "0.45"))
        min_top_score_strict = float(os.getenv("MIN_TOP_SOURCE_SCORE_STRICT", "0.52"))
        retrieval_disclaimer = None
        fallback_reason = None

        def _run_retrieval(target_namespace, target_class_filter, target_chunks):
            if not pinecone_available:
                return "", []
            context_value, sources_value = search_rag_with_class_filter(
                pinecone_index=search_components['rag_index'],
                query_embedding=rag_query_embedding,
                n_chunks=target_chunks,
                namespace=target_namespace,
                class_filter=target_class_filter,
            )
            filtered = filter_sources_by_score(sources_value, min_source_score)
            return context_value, filtered

        if pinecone_available:
            retrieval_steps = []
            if strict_subject_selected or strict_class_selected:
                retrieval_steps.append((effective_namespace, resolved_class_filter, n_results, "strict"))
                if strict_subject_selected:
                    retrieval_steps.append(("", resolved_class_filter, n_results + 2, "subject_fallback"))
                if strict_class_selected:
                    retrieval_steps.append(("", None, n_results + 3, "class_fallback"))
            else:
                retrieval_steps.append((effective_namespace, resolved_class_filter, n_results, "default"))

            seen_steps = set()
            context = ""
            sources = []
            matched_step = None

            for step_namespace, step_class, step_chunks, step_label in retrieval_steps:
                step_key = (step_namespace, step_class, step_chunks)
                if step_key in seen_steps:
                    continue
                seen_steps.add(step_key)

                if DEBUG_MODE:
                    print(
                        f"DEBUG: Retrieval step={step_label}, namespace='{step_namespace}', "
                        f"class_filter='{step_class}', n_chunks={step_chunks}"
                    )
                decision_path.append(f"retrieval_try:{step_label}")

                context_try, sources_try = _run_retrieval(step_namespace, step_class, step_chunks)
                if sources_try:
                    context = context_try
                    sources = sources_try
                    matched_step = step_label
                    decision_path.append(f"retrieval_hit:{step_label}:{len(sources_try)}")
                    break

            if matched_step in {"subject_fallback", "class_fallback"}:
                if strict_subject_selected and strict_class_selected:
                    fallback_reason = "selected subject and class"
                    retrieval_disclaimer = (
                        "I couldn't find a strong match in your selected subject/class. "
                        "Showing the closest available results from other resources."
                    )
                elif strict_subject_selected:
                    fallback_reason = "selected subject"
                    retrieval_disclaimer = (
                        "I couldn't find a strong match in your selected subject. "
                        "Showing the closest available results from other subjects."
                    )
                elif strict_class_selected:
                    fallback_reason = "selected class"
                    retrieval_disclaimer = (
                        "I couldn't find a strong match in your selected class. "
                        "Showing the closest available results from other classes/resources."
                    )
            elif matched_step is None:
                context = ""
                sources = []
                decision_path.append("retrieval_hit:none")
        else:
            context, sources = "", []
            decision_path.append("retrieval_skipped:pinecone_unavailable")
        
        # Check timeout
        if time.time() - start_time > timeout_seconds:
            return jsonify({"error": "Request timeout"}), 408
        
        # Debug logging for context quality
        if DEBUG_MODE:
            print(f"DEBUG: Retrieved {len(sources)} sources for query: '{query[:50]}...'")
            print(f"DEBUG: Context length: {len(context)} characters")
            if sources:
                print(f"DEBUG: Best match score: {sources[0]['score']}")
                print(f"DEBUG: First source metadata: {sources[0].get('subject', 'N/A')}, {sources[0].get('class', 'N/A')}, {sources[0].get('chapter_name', 'N/A')}")
        
        compact_context = trim_context_from_sources(sources, max_chars=answer_profile['context_chars'])
        
        # Get best match score and metadata for prompt quality assessment
        best_score = sources[0]['score'] if sources else 0.0
        source_metadata = sources[0] if sources else None
        overlap_count = query_source_overlap_count(query, source_metadata) if source_metadata else 0

        if sources and (best_score < min_top_score_strict or overlap_count == 0):
            decision_path.append(f"strict_guard_drop:score={round(best_score,3)}:overlap={overlap_count}")
            sources = []
            context = ""
            compact_context = ""
            best_score = 0.0
            source_metadata = None
            fallback_reason = fallback_reason or "low_relevance_or_no_overlap"
            retrieval_disclaimer = (
                "I couldn't find a reliable match in indexed NCERT resources for this query. "
                "The answer below is AI-generated guidance."
            )
        else:
            decision_path.append(f"overlap_count:{overlap_count}")

        decision_path.append(f"best_score:{round(best_score, 3)}")

        # Generate RAG response using provider routing
        rag_response = None
        warning = None
        provider_used = None
        rag_response, provider_used, route_error = generate_with_model_routing(
            query=query,
            context=compact_context,
            answer_profile=answer_profile,
            answer_mode=resolved_answer_length,
            llm_temperature=llm_temperature,
            llm_top_p=llm_top_p,
            llm_max_tokens=llm_max_tokens,
            best_match_score=best_score,
            source_metadata=source_metadata,
        )

        if not rag_response:
            warning = route_error or "LLM unavailable"
            rag_response = build_fallback_response(context, sources, query)
            decision_path.append("llm_fallback:context_builder")
        else:
            decision_path.append(f"llm_provider:{provider_used or 'unknown'}")

        if not sources:
            retrieval_disclaimer = (
                "Your query was not found in our indexed NCERT resources. "
                "The answer below is AI-generated guidance and may be less reliable than textbook-backed answers."
            )
            decision_path.append("disclaimer:no_indexed_sources")
        elif retrieval_disclaimer:
            decision_path.append("disclaimer:strict_filter_fallback")

        rag_response = sanitize_model_identity_text(rag_response)
        rag_response = prepend_disclaimer(rag_response, retrieval_disclaimer)
        rag_response = enforce_answer_length(rag_response, answer_profile)
        
        # MCQ search for related questions (only if Pinecone is available)
        # Use enhanced query based on retrieved context for better MCQ matching
        mcq_query = query
        if sources and len(sources) > 0:
            # Extract key terms from best matching sources to improve MCQ search
            # This helps when user has typos (e.g., "ganfa" -> should find "ganga" PYQs)
            top_source = sources[0]
            topic = top_source.get('topic', '')
            chapter_name = top_source.get('chapter_name', '')
            subject = top_source.get('subject', '')
            
            # Build enhanced query using metadata from best match
            enhanced_terms = []
            if topic and len(topic) > 3:
                enhanced_terms.append(topic)
            if chapter_name and len(chapter_name) > 3:
                enhanced_terms.append(chapter_name)
            
            # If we have good metadata, enhance the query
            if enhanced_terms:
                mcq_query = f"{query} {' '.join(enhanced_terms[:2])}"  # Combine original + top 2 metadata terms
                if DEBUG_MODE:
                    print(f"DEBUG MCQ: Enhanced query from '{query}' to '{mcq_query}' based on source metadata")
            
        if pinecone_available and 'mcq_index' in search_components and 'mcq_model' in search_components:
            mcq_results = query_mcq(
                search_components['mcq_index'],
                search_components['mcq_model'],
                mcq_query,
                mcq_threshold,
                mcq_limit
            )
        else:
            mcq_results = []
        
        response_payload = {
            "rag_response": rag_response,
            "sources": sources,
            "mcq_results": mcq_results,
            "query": query,
            "namespace_used": namespace if namespace else "all",
            "class_filter": resolved_class_filter,
            "answer_length": resolved_answer_length,
            "provider_used": provider_used,
            "retrieval_disclaimer": retrieval_disclaimer,
            "fallback_reason": fallback_reason,
            "intent": intent_label,
            "decision_path": decision_path,
            "best_score": round(float(best_score), 3),
            "source_count": len(sources),
            "search_settings": {
                "n_results": n_results,
                "mcq_threshold": mcq_threshold,
                "mcq_limit": mcq_limit
            },
            "answer_settings": {
                "temperature": llm_temperature,
                "top_p": llm_top_p,
                "max_tokens": llm_max_tokens
            },
            "timestamp": time.time(),
            "request_id": request_id,
            "elapsed_ms": int((time.time() - start_time) * 1000),
        }
        if not pinecone_available:
            warning = (warning + " | " if warning else "") + "Pinecone unavailable; returning LLM-only response"
        if warning:
            response_payload["warning"] = warning

        app.logger.info(
            "search_decision request_id=%s intent=%s provider=%s ns=%s class=%s best_score=%.3f sources=%s path=%s",
            request_id,
            intent_label,
            provider_used or "none",
            effective_namespace or "all",
            resolved_class_filter or "none",
            float(best_score),
            len(sources),
            " > ".join(decision_path[:12]),
        )

        return jsonify(response_payload), 200
        
    except Exception as e:
        app.logger.error(f"Error in search endpoint: {str(e)}")
        # Return user-friendly error message
        return jsonify({
            "error": "Sorry, I couldn't process your request. Could you please rephrase your question?",
            "suggestions": [
                "Tell me about the Ganga river",
                "Explain photosynthesis",
                "What is democracy?",
                "Describe the water cycle"
            ],
            "technical_error": str(e) if DEBUG_MODE else None
        }), 500


@app.route('/api/class-options', methods=['GET'])
def get_class_options():
    """Return available normalized class filters for chat retrieval."""
    return jsonify({"classes": CLASS_OPTIONS}), 200

@app.route("/api/total-questions", methods=["GET"])
def get_total_questions():
    """Get total number of questions in the MCQ database"""
    global search_components
    
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    
    try:
        # Get stats from the MCQ index
        mcq_index = search_components.get('mcq_index')
        if not mcq_index:
            return jsonify({"error": "MCQ index not available"}), 500
        
        # Get index stats to find total vector count
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        total_questions = stats.get('total_vector_count', 0)
        
        return jsonify({
            "total_questions": total_questions,
            "status": "success",
            "timestamp": time.time()
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting total questions: {str(e)}")
        return jsonify({
            "error": f"Failed to get total questions: {str(e)}",
            "total_questions": 0
        }), 500

@app.route("/api/search-settings", methods=["GET"])
def get_search_settings():
    """Expose active search and answer-generation settings."""
    return jsonify({
        "search": {
            "n_results": int(os.getenv("DEFAULT_N_RESULTS", "5")),
            "mcq_threshold": float(os.getenv("DEFAULT_MCQ_THRESHOLD", "0.25")),
            "mcq_limit": int(os.getenv("DEFAULT_MCQ_LIMIT", "0"))
        },
        "answer_generation": {
            "temperature": float(os.getenv("DEFAULT_ANSWER_TEMPERATURE", "0.3")),
            "top_p": float(os.getenv("DEFAULT_ANSWER_TOP_P", "0.9")),
            "max_tokens": int(os.getenv("DEFAULT_ANSWER_MAX_TOKENS", "1500"))
        },
        "answer_length_modes": [
            {
                "value": key,
                "label": value["label"],
                "max_tokens": value["max_tokens"],
                "min_words": value.get("min_words"),
                "max_words": value.get("max_words"),
                "context_chars": value.get("context_chars")
            }
            for key, value in ANSWER_LENGTH_PROFILES.items()
        ],
        "model_routing": {
            "primary": "openai",
            "fallback": "groq"
        },
        "notes": {
            "mcq_limit": "0 means no hard cap; returns all matches above threshold"
        }
    }), 200

@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Get system statistics"""
    global search_components
    
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    
    try:
        # Get stats from the MCQ index
        mcq_index = search_components.get('mcq_index')
        rag_index = search_components.get('rag_index')
        
        total_questions = 0
        total_books = 0
        
        if mcq_index:
            mcq_stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
            total_questions = mcq_stats.get('total_vector_count', 0)
        
        if rag_index:
            rag_stats = _get_index_stats_cached(rag_index, 'rag_index_stats', ttl_seconds=60)
            # RAG index contains document chunks, approximate books by dividing by average chunks per book
            total_chunks = rag_stats.get('total_vector_count', 0)
            # Estimate books based on namespaces (5 main subjects)
            namespaces = rag_stats.get('namespaces', {})
            total_books = len(namespaces)
        
        return jsonify({
            "total_questions": total_questions,
            "total_books": total_books,
            "total_users": 1,  # Single user system for now
            "avg_response_time": "1.2s",  # Typical response time
            "system_status": "operational",
            "timestamp": time.time()
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting stats: {str(e)}")
        return jsonify({
            "error": f"Failed to get stats: {str(e)}",
            "total_questions": 0,
            "total_books": 0,
            "total_users": 0,
            "avg_response_time": "N/A",
            "system_status": "error"
        }), 500

@app.route("/api/questions", methods=["GET"])
def get_questions():
    """Get questions from the MCQ database with filtering"""
    global search_components
    
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    
    exam_filter = request.args.get('exam', 'all')
    subject_filter = request.args.get('subject', 'all')
    limit = int(request.args.get('limit', 50))
    
    try:
        # Get questions from MCQ index
        mcq_index = search_components.get('mcq_index')
        if not mcq_index:
            return jsonify({"error": "MCQ index not available"}), 500
        
        # Get all available namespaces dynamically from index stats
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        pyq_namespaces = list(stats.namespaces.keys()) if stats.namespaces else ["CIVIL SERVICES EXAMS", "BANKING EXAMS", "SCHOOL EXAMS"]
        all_questions = []
        
        # Query for questions - using dummy query to get random questions
        mcq_model = search_components.get('mcq_model')
        dummy_query = encode_query(mcq_model, "sample question")
        
        for namespace in pyq_namespaces:
            try:
                # Get questions from each namespace
                results = safe_pinecone_query(
                    mcq_index,
                    dummy_query,
                    top_k=min(limit * 2, 200),  # Get extra for filtering
                    include_metadata=True,
                    namespace=namespace
                )
                
                for i, match in enumerate(results['matches']):
                    metadata = match.get('metadata', {})
                    
                    # Extract data from full_json_str field (new structure)
                    full_question_data = {}
                    if 'full_json_str' in metadata:
                        try:
                            import json
                            full_question_data = json.loads(metadata['full_json_str'])
                        except (json.JSONDecodeError, Exception) as e:
                            app.logger.warning(f"⚠️ Error parsing full_json_str: {e}")
                            full_question_data = {}
                    
                    # Extract required fields - prioritize full_json_str, fallback to metadata
                    question_text = full_question_data.get('question', metadata.get('question', ''))
                    exam_name = full_question_data.get('exam_name', metadata.get('exam_name', 'Unknown'))
                    exam_year = full_question_data.get('exam_year', metadata.get('exam_year', 'Unknown'))
                    exam_term = full_question_data.get('exam_term', metadata.get('exam_term', ''))
                    subject = full_question_data.get('subject', metadata.get('subject', 'Unknown'))
                    explanation = full_question_data.get('explanation', metadata.get('explanation', ''))
                    correct_option = full_question_data.get('correct_option', metadata.get('correct_option', ''))
                    correct_answer = full_question_data.get('correct_answer', metadata.get('correct_answer', ''))
                    
                    # Get options
                    options_dict = full_question_data.get('options', {})
                    if not options_dict:
                        # Fallback: reconstruct from individual metadata fields
                        options_dict = {}
                        if metadata.get('option_a'):
                            options_dict['a'] = metadata.get('option_a')
                        if metadata.get('option_b'):
                            options_dict['b'] = metadata.get('option_b')
                        if metadata.get('option_c'):
                            options_dict['c'] = metadata.get('option_c')
                        if metadata.get('option_d'):
                            options_dict['d'] = metadata.get('option_d')
                    
                    # Convert options dict to array for frontend compatibility
                    option_keys = ['a', 'b', 'c', 'd']
                    options_array = []
                    for key in option_keys:
                        if key in options_dict:
                            options_array.append(options_dict[key])
                    
                    # Get correct answer index
                    correct_answer_index = None
                    if correct_option and correct_option in option_keys:
                        correct_answer_index = option_keys.index(correct_option)
                    
                    # Apply filters
                    if exam_filter != 'all' and exam_name.lower() != exam_filter.lower():
                        continue
                    if subject_filter != 'all' and subject.lower() != subject_filter.lower():
                        continue
                    
                    # Generate a unique ID using timestamp and question hash
                    question_hash = hashlib.md5(question_text.encode()).hexdigest()[:8]
                    unique_id = f"{int(time.time() * 1000)}_{question_hash}_{i}_{namespace}"
                    
                    # Extract question data with required fields only
                    question_data = {
                        "id": unique_id,
                        "question": question_text,
                        "options": options_array,
                        "correct_option": correct_option,
                        "correct_answer": correct_answer_index,
                        "correct_answer_text": correct_answer,
                        "exam_name": exam_name,
                        "exam_year": exam_year,
                        "year": exam_year,
                        "exam_term": exam_term,
                        "term": exam_term,
                        "subject": subject,
                        "explanation": explanation,
                        "metadata": {
                            "exam": exam_name,
                            "exam_name": exam_name,
                            "exam_year": exam_year,
                            "exam_term": exam_term,
                            "term": exam_term,
                            "year": exam_year,
                            "subject": subject
                        }
                    }
                    all_questions.append(question_data)
                    
                    if len(all_questions) >= limit:
                        break
                        
            except Exception as e:
                app.logger.warning(f"⚠️ Error querying namespace {namespace}: {str(e)}")
                continue
        
        # Limit to requested number
        questions = all_questions[:limit]
        
        return jsonify({
            "questions": questions,
            "total": len(questions),
            "filters": {
                "exam": exam_filter,
                "subject": subject_filter
            },
            "timestamp": time.time()
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting questions: {str(e)}")
        return jsonify({
            "error": f"Failed to get questions: {str(e)}",
            "questions": [],
            "total": 0
        }), 500

@app.route("/api/filters", methods=["GET"])
def get_filter_options():
    """Get unique exam names and subjects from MCQ database for filter dropdowns"""
    global search_components
    
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    
    try:
        # Get unique exams and subjects from MCQ index
        mcq_index = search_components.get('mcq_index')
        if not mcq_index:
            return jsonify({"error": "MCQ index not available"}), 500
        
        # Get all available namespaces dynamically from index stats
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        pyq_namespaces = list(stats.namespaces.keys()) if stats.namespaces else ["CIVIL SERVICES EXAMS", "BANKING EXAMS", "SCHOOL EXAMS"]
        unique_exams = set()
        unique_subjects = set()
        
        # Query for questions from each namespace to extract metadata
        mcq_model = search_components.get('mcq_model')
        dummy_query = encode_query(mcq_model, "filter query")
        
        for namespace in pyq_namespaces:
            try:
                # Get questions from each namespace
                results = safe_pinecone_query(
                    mcq_index,
                    dummy_query,
                    top_k=1000,  # Get many results to extract all unique values
                    include_metadata=True,
                    namespace=namespace
                )
                
                for match in results['matches']:
                    metadata = match.get('metadata', {})
                    
                    # Extract data from full_json_str field (new structure)
                    full_question_data = {}
                    if 'full_json_str' in metadata:
                        try:
                            import json
                            full_question_data = json.loads(metadata['full_json_str'])
                        except (json.JSONDecodeError, Exception):
                            full_question_data = {}
                    
                    # Extract exam name
                    exam_name = full_question_data.get('exam_name', metadata.get('exam_name', ''))
                    if exam_name and exam_name.strip():
                        unique_exams.add(exam_name.strip())
                    
                    # Extract subject
                    subject = full_question_data.get('subject', metadata.get('subject', ''))
                    if subject and subject.strip():
                        unique_subjects.add(subject.strip())
                        
            except Exception as e:
                app.logger.warning(f"⚠️ Error querying namespace {namespace} for filters: {str(e)}")
                continue
        
        # Convert to sorted lists for consistent ordering
        exams_list = sorted(list(unique_exams))
        subjects_list = sorted(list(unique_subjects))
        
        return jsonify({
            "exams": exams_list,
            "subjects": subjects_list,
            "total_exams": len(exams_list),
            "total_subjects": len(subjects_list),
            "timestamp": time.time()
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting filter options: {str(e)}")
        return jsonify({
            "error": f"Failed to get filter options: {str(e)}",
            "exams": [],
            "subjects": []
        }), 500

@app.route("/api/books", methods=["GET"])
def get_books():
    """Get inserted books/subjects from Pinecone index statistics"""
    global search_components
    
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    
    try:
        # Get books from RAG index statistics
        rag_index = search_components.get('rag_index')
        if not rag_index:
            return jsonify({"error": "RAG index not available"}), 500
        
        # Get index statistics to see what namespaces exist
        stats = _get_index_stats_cached(rag_index, 'rag_index_stats', ttl_seconds=120)
        namespaces = stats.namespaces if stats.namespaces else {}
        
        books_list = []
        
        # Map of known subjects/namespaces to display names
        subject_info = {
            "geography": {
                "title": "NCERT Geography",
                "description": "Complete Geography curriculum from NCERT",
                "classes": ["6th", "10th", "11th", "12th"],
                "topics": ["Physical Geography", "Climate", "Solar System", "Natural Vegetation", "Weather Systems"]
            },
            "history": {
                "title": "NCERT History", 
                "description": "Complete History curriculum from NCERT",
                "classes": ["6th", "10th", "11th", "12th"],
                "topics": ["Ancient History", "Medieval History", "Modern History", "Freedom Struggle"]
            },
            "polity": {
                "title": "NCERT Political Science",
                "description": "Complete Polity curriculum from NCERT", 
                "classes": ["6th", "10th", "11th", "12th"],
                "topics": ["Constitution", "Government", "Democracy", "Elections", "Rights"]
            },
            "economics": {
                "title": "NCERT Economics",
                "description": "Complete Economics curriculum from NCERT",
                "classes": ["6th", "10th", "11th", "12th"], 
                "topics": ["Microeconomics", "Macroeconomics", "Development", "Globalization"]
            },
            "science": {
                "title": "NCERT Science",
                "description": "Complete Science curriculum from NCERT",
                "classes": ["6th", "7th", "8th", "9th", "10th"],
                "topics": ["Physics", "Chemistry", "Biology", "Environmental Science"]
            }
        }
        
        # Create book entries for each namespace that has data
        for namespace, namespace_stats in namespaces.items():
            vector_count = namespace_stats.vector_count
            if vector_count > 0:
                subject_data = subject_info.get(namespace, {
                    "title": f"NCERT {namespace.title()}",
                    "description": f"Educational content for {namespace}",
                    "classes": ["Multiple Classes"],
                    "topics": ["Various Topics"]
                })
                
                book_data = {
                    "title": subject_data["title"],
                    "source": f"NCERT {namespace.title()}",
                    "namespace": namespace,
                    "description": subject_data["description"],
                    "total_chunks": vector_count,
                    "classes": subject_data["classes"],
                    "topics": subject_data["topics"],
                    "status": "✅ Indexed",
                    "last_updated": time.strftime("%Y-%m-%d", time.localtime())
                }
                books_list.append(book_data)
        
        # Add information about available but not indexed subjects
        all_subjects = ["geography", "history", "polity", "economics", "science"]
        indexed_subjects = list(namespaces.keys())
        
        for subject in all_subjects:
            if subject not in indexed_subjects:
                subject_data = subject_info[subject]
                book_data = {
                    "title": subject_data["title"],
                    "source": f"NCERT {subject.title()}",
                    "namespace": subject,
                    "description": subject_data["description"],
                    "total_chunks": 0,
                    "classes": subject_data["classes"],
                    "topics": subject_data["topics"],
                    "status": "⏳ Available (Not Indexed)",
                    "last_updated": "Not indexed yet"
                }
                books_list.append(book_data)
        
        return jsonify({
            "books": books_list,
            "total": len(books_list),
            "indexed_count": len([b for b in books_list if b["total_chunks"] > 0]),
            "available_count": len([b for b in books_list if b["total_chunks"] == 0]),
            "timestamp": time.time()
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting books: {str(e)}")
        return jsonify({
            "error": f"Failed to get books: {str(e)}",
            "books": [],
            "total": 0
        }), 500

@app.route("/api/inserted-pyqs", methods=["GET"])
def get_inserted_pyqs():
    """Get inserted PYQs from MCQ index statistics with hierarchical exam structure"""
    global search_components
    
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    
    try:
        # Get PYQs from MCQ index statistics
        mcq_index = search_components.get('mcq_index')
        if not mcq_index:
            return jsonify({"error": "MCQ index not available"}), 500
        
        # Get index statistics to see what namespaces exist
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        namespaces = stats.namespaces if stats.namespaces else {}
        
        pyq_list = []
        total_questions = 0
        
        # For each namespace with actual data, extract hierarchical exam information
        for namespace, namespace_stats in namespaces.items():
            vector_count = namespace_stats.vector_count
            if vector_count > 0:
                # Query the namespace to get detailed exam information
                try:
                    mcq_model = search_components.get('mcq_model')
                    dummy_query = encode_query(mcq_model, "sample")
                    results = safe_pinecone_query(
                        mcq_index,
                        dummy_query,
                        top_k=min(vector_count, 1000),  # Get all or up to 1000 questions
                        include_metadata=True,
                        namespace=namespace
                    )
                    
                    # Create hierarchical structure: main_exam -> sub_exam -> year -> term
                    main_exam_structure = {}
                    
                    for match in results['matches']:
                        metadata = match.get('metadata', {})
                        
                        # Extract data from full_json_str field
                        full_question_data = {}
                        if 'full_json_str' in metadata:
                            try:
                                import json
                                full_question_data = json.loads(metadata['full_json_str'])
                            except (json.JSONDecodeError, Exception):
                                full_question_data = {}
                        
                        # Extract exam information
                        main_exam = namespace  # Use namespace as main exam (e.g., "SCHOOL EXAMS")
                        sub_exam = full_question_data.get('exam_name', metadata.get('exam_name', 'Unknown Sub Exam'))
                        year = full_question_data.get('exam_year', metadata.get('exam_year', 'Unknown'))
                        term = full_question_data.get('exam_term', metadata.get('exam_term', ''))
                        
                        # Build hierarchical structure
                        if main_exam not in main_exam_structure:
                            main_exam_structure[main_exam] = {}
                        
                        if sub_exam not in main_exam_structure[main_exam]:
                            main_exam_structure[main_exam][sub_exam] = {}
                        
                        if year not in main_exam_structure[main_exam][sub_exam]:
                            main_exam_structure[main_exam][sub_exam][year] = {}
                        
                        if term not in main_exam_structure[main_exam][sub_exam][year]:
                            main_exam_structure[main_exam][sub_exam][year][term] = 0
                        
                        main_exam_structure[main_exam][sub_exam][year][term] += 1
                    
                    # Convert hierarchical structure to flat list for display
                    for main_exam, sub_exams in main_exam_structure.items():
                        for sub_exam, years in sub_exams.items():
                            # Collect all years and terms for this sub exam
                            available_years = []
                            available_terms = []
                            sub_exam_questions = 0
                            
                            for year, terms in years.items():
                                if year and year != 'Unknown':
                                    available_years.append(year)
                                for term, question_count in terms.items():
                                    if term and term.strip():
                                        available_terms.append(term)
                                    sub_exam_questions += question_count
                            
                            # Remove duplicates and sort
                            available_years = sorted(list(set(available_years)))
                            available_terms = sorted(list(set([t for t in available_terms if t.strip()])))
                            
                            pyq_data = {
                                "title": f"{sub_exam}",
                                "main_exam": main_exam,
                                "sub_exam": sub_exam,
                                "years": available_years,
                                "terms": available_terms if available_terms else [],
                                "total_questions": sub_exam_questions,
                                "namespace": namespace,
                                "status": "✅ Active",
                                "last_updated": time.strftime("%Y-%m-%d", time.localtime())
                            }
                            pyq_list.append(pyq_data)
                            total_questions += sub_exam_questions
                        
                except Exception as e:
                    app.logger.warning(f"⚠️ Error extracting details from namespace {namespace}: {str(e)}")
                    # Fallback to basic info
                    pyq_data = {
                        "title": f"{namespace}",
                        "main_exam": namespace,
                        "sub_exam": "Various Exams",
                        "years": [],
                        "terms": [],
                        "total_questions": vector_count,
                        "namespace": namespace,
                        "status": "✅ Active",
                        "last_updated": time.strftime("%Y-%m-%d", time.localtime())
                    }
                    pyq_list.append(pyq_data)
                    total_questions += vector_count
        
        return jsonify({
            "inserted_pyqs": pyq_list,
            "total": len(pyq_list),
            "indexed_count": len(pyq_list),
            "available_count": 0,
            "total_questions": total_questions,
            "timestamp": time.time()
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting inserted PYQs: {str(e)}")
        return jsonify({
            "error": f"Failed to get inserted PYQs: {str(e)}",
            "inserted_pyqs": [],
            "total": 0
        }), 500

def search_all_namespaces(pinecone_index, model, query: str, n_chunks: int = 2, query_embedding=None):
    """Search across all namespaces and return best results"""
    namespaces = EDU_NAMESPACES
    all_results = []

    if query_embedding is None:
        query_embedding = encode_query(model, query)

    def _query_namespace(namespace):
        results = pinecone_index.query(
            vector=query_embedding,
            top_k=n_chunks,
            include_metadata=True,
            namespace=namespace
        )
        return namespace, results

    with ThreadPoolExecutor(max_workers=min(5, len(namespaces))) as executor:
        futures = [executor.submit(_query_namespace, namespace) for namespace in namespaces]
        for future in futures:
            try:
                namespace, results = future.result()
                if results['matches']:
                    for match in results['matches']:
                        match['namespace'] = namespace
                    all_results.extend(results['matches'])
            except Exception as e:
                app.logger.warning(f"⚠️ Error searching namespace: {str(e)}")

    # Sort by relevance score and take top results
    all_results.sort(key=lambda x: x['score'], reverse=True)
    top_results = all_results[:n_chunks]
    formatted_results = {'matches': top_results}
    context, sources = get_context_with_sources(formatted_results)

    return context, sources


def search_rag_with_class_filter(pinecone_index, query_embedding, n_chunks: int = 5, namespace: str = "", class_filter: str | None = None):
    """Search RAG index with optional namespace and class filtering using class_normalized."""
    namespaces = [namespace] if namespace and namespace != "all" else EDU_NAMESPACES
    all_results = []
    filter_dict = {"class_normalized": {"$eq": class_filter}} if class_filter else None
    
    print(f"DEBUG RAG: Searching namespaces={namespaces}, filter={filter_dict}, n_chunks={n_chunks}")

    def _query_namespace(ns):
        try:
            response = pinecone_index.query(
                vector=query_embedding,
                top_k=max(3, n_chunks * 2),
                include_metadata=True,
                namespace=ns,
                filter=filter_dict,
            )
            print(f"DEBUG RAG: Namespace '{ns}' returned {len(response.get('matches', []))} matches")
            return ns, response
        except Exception as e:
            print(f"ERROR RAG: Failed to query namespace '{ns}': {e}")
            raise

    with ThreadPoolExecutor(max_workers=min(4, len(namespaces))) as executor:
        futures = [executor.submit(_query_namespace, ns) for ns in namespaces]
        for future in futures:
            try:
                ns, response = future.result()
                for match in response.get('matches', []):
                    match['namespace'] = ns
                    all_results.append(match)
            except Exception as e:
                app.logger.warning(f"RAG namespace query failed: {e}")
                print(f"ERROR RAG: Exception during namespace query: {e}")

    print(f"DEBUG RAG: Total results across all namespaces: {len(all_results)}")
    all_results.sort(key=lambda x: x.get('score', 0), reverse=True)
    top_results = all_results[:max(1, n_chunks)]
    print(f"DEBUG RAG: Returning top {len(top_results)} results")
    formatted_results = {'matches': top_results}
    return get_context_with_sources(formatted_results)

def query_mcq(mcq_index, mcq_model, query_text, similarity_threshold=0.2, top_k=0):
    """Query MCQ index for relevant questions across all namespaces"""
    try:
        query_embedding = encode_query(mcq_model, query_text)
        
        # Get all available namespaces dynamically from index stats
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        pyq_namespaces = list(stats.namespaces.keys()) if stats.namespaces else ["CIVIL SERVICES EXAMS", "BANKING EXAMS", "SCHOOL EXAMS"]
        all_results = []

        normalized_top_k = int(top_k) if top_k is not None else 0
        unlimited_results = normalized_top_k <= 0
        per_namespace_top_k = min(500, max(50, normalized_top_k * 2)) if not unlimited_results else 1000

        def _query_namespace(namespace):
            response = mcq_index.query(
                vector=query_embedding,
                top_k=per_namespace_top_k,
                include_metadata=True,
                namespace=namespace
            )
            return namespace, response

        with ThreadPoolExecutor(max_workers=min(6, len(pyq_namespaces))) as executor:
            futures = [executor.submit(_query_namespace, namespace) for namespace in pyq_namespaces]
            for future in futures:
                try:
                    namespace, response = future.result()
                    for match in response['matches']:
                        match['namespace'] = namespace
                        all_results.append(match)
                except Exception as e:
                    app.logger.warning(f"⚠️ Error searching namespace: {str(e)}")
                    continue
        
        # Sort all results by score
        all_results.sort(key=lambda x: x['score'], reverse=True)
        
        # Filter results by similarity threshold
        filtered_results = [
            result for result in all_results if result['score'] >= similarity_threshold
        ]

        selected_results = filtered_results if unlimited_results else filtered_results[:normalized_top_k]
        
        # Format MCQ results for frontend
        formatted_mcqs = []
        for result in selected_results:
            metadata = result['metadata']
            
            # Extract data from full_json_str field (new structure)
            full_question_data = {}
            if 'full_json_str' in metadata:
                try:
                    import json
                    full_question_data = json.loads(metadata['full_json_str'])
                except (json.JSONDecodeError, Exception) as e:
                    app.logger.warning(f"⚠️ Error parsing full_json_str: {e}")
                    # Fallback to individual metadata fields
                    full_question_data = {}
            
            # Extract required fields - prioritize full_json_str, fallback to metadata
            question_text = full_question_data.get('question', metadata.get('question', ''))
            if not question_text and 'text' in metadata:
                question_text = metadata['text'].split('Options:')[0].replace('Q:', '').strip() if 'Options:' in metadata['text'] else metadata['text']
            
            # Get options - prioritize full_json_str structure
            options_dict = full_question_data.get('options', {})
            if not options_dict:
                # Fallback: reconstruct from individual metadata fields
                if metadata.get('option_a'):
                    options_dict['a'] = metadata.get('option_a')
                if metadata.get('option_b'):
                    options_dict['b'] = metadata.get('option_b')
                if metadata.get('option_c'):
                    options_dict['c'] = metadata.get('option_c')
                if metadata.get('option_d'):
                    options_dict['d'] = metadata.get('option_d')
            
            # Convert options dict to array for frontend compatibility
            option_keys = ['a', 'b', 'c', 'd']
            options_array = []
            for key in option_keys:
                if key in options_dict:
                    options_array.append(options_dict[key])
            
            # Get correct option key and convert to index
            correct_option = full_question_data.get('correct_option', metadata.get('correct_option', ''))
            correct_answer_index = None
            if correct_option and correct_option in option_keys:
                correct_answer_index = option_keys.index(correct_option)
            
            # Get correct answer text
            correct_answer_text = full_question_data.get('correct_answer', metadata.get('correct_answer', ''))
            if not correct_answer_text and correct_option and options_dict and correct_option in options_dict:
                correct_answer_text = options_dict[correct_option]
            
            # Extract other required fields
            exam_name = full_question_data.get('exam_name', metadata.get('exam_name', 'Unknown'))
            exam_year = full_question_data.get('exam_year', metadata.get('exam_year', 'Unknown'))
            exam_term = full_question_data.get('exam_term', metadata.get('exam_term', ''))
            subject = full_question_data.get('subject', metadata.get('subject', 'Unknown'))
            explanation = full_question_data.get('explanation', metadata.get('explanation', ''))
            
            # Generate a stable unique ID for persistence on frontend
            stable_id_source = f"{exam_name}|{exam_year}|{exam_term}|{subject}|{question_text}".lower().strip()
            unique_id = hashlib.md5(stable_id_source.encode()).hexdigest()
            
            formatted_mcqs.append({
                'id': unique_id,
                'question': question_text,
                'options': options_array,  # Array format: ["option1", "option2", ...]
                'correct_option': correct_option,  # Key like "a", "b", "c", "d"
                'correct_answer': correct_answer_index,  # Index (0, 1, 2, 3) for frontend
                'correct_answer_text': correct_answer_text,  # Actual answer text
                'exam_name': exam_name,
                'year': exam_year,
                'exam_year': exam_year,
                'term': exam_term,
                'exam_term': exam_term,
                'subject': subject,
                'metadata': {
                    'exam_name': exam_name,
                    'exam_term': exam_term,
                    'exam_year': exam_year,
                    'subject': subject,
                    'exam': exam_name,
                    'term': exam_term,
                    'year': exam_year
                },
                'explanation': explanation,
                'topic': full_question_data.get('topic', metadata.get('topic', '')),
                'similarity': round(result['score'], 3)
            })
        
        return formatted_mcqs
    except Exception as e:
        app.logger.error(f"Error querying MCQs: {str(e)}")
        return []

# Dashboard tracking storage (in production, use a proper database)
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
    """Get dashboard statistics"""
    try:
        # Calculate accuracy
        total_attempted = user_stats['total_mcq_attempted']
        accuracy = 0
        if total_attempted > 0:
            accuracy = round((user_stats['mcq_correct'] / total_attempted) * 100, 1)
        
        return jsonify({
            'totalChats': user_stats['total_chats'],
            'totalQuestions': user_stats['total_questions'],
            'totalMcqAttempted': user_stats['total_mcq_attempted'],
            'mcqCorrect': user_stats['mcq_correct'],
            'mcqWrong': user_stats['mcq_wrong'],
            'mcqAccuracy': accuracy,
            'timestamp': time.time()
        }), 200
    except Exception as e:
        app.logger.error(f"Error getting dashboard stats: {str(e)}")
        return jsonify({
            'error': f'Failed to get dashboard stats: {str(e)}',
            'totalChats': 0,
            'totalQuestions': 0,
            'totalMcqAttempted': 0,
            'mcqCorrect': 0,
            'mcqWrong': 0,
            'mcqAccuracy': 0
        }), 500

@app.route("/api/dashboard/subjects", methods=["GET"])
def get_subject_stats():
    """Get subject-wise statistics"""
    try:
        subjects = []
        colors = ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280']
        
        for i, (subject, count) in enumerate(user_stats['subjects'].items()):
            subjects.append({
                'name': subject,
                'questions': count,
                'color': colors[i % len(colors)]
            })
        
        return jsonify({
            'subjects': subjects,
            'timestamp': time.time()
        }), 200
    except Exception as e:
        app.logger.error(f"Error getting subject stats: {str(e)}")
        return jsonify({
            'subjects': [],
            'error': str(e)
        }), 500

@app.route("/api/dashboard/achievements", methods=["GET"])
def get_achievements():
    """Get user achievements"""
    try:
        return jsonify({
            'achievements': user_stats['achievements'],
            'timestamp': time.time()
        }), 200
    except Exception as e:
        app.logger.error(f"Error getting achievements: {str(e)}")
        return jsonify({
            'achievements': [],
            'error': str(e)
        }), 500

@app.route("/api/dashboard/goals", methods=["GET"])
def get_learning_goals():
    """Get learning goals and progress"""
    try:
        # Update goals with current stats
        goals = user_stats['goals'].copy()
        for goal in goals:
            if goal['type'] == 'daily':
                # For demo, use total questions
                goal['current'] = min(user_stats['total_questions'], goal['target'])
            elif goal['type'] == 'weekly':
                # For demo, use total chats
                goal['current'] = min(user_stats['total_chats'], goal['target'])
            elif goal['type'] == 'subjects':
                # Count how many subjects have been used
                subjects_used = sum(1 for count in user_stats['subjects'].values() if count > 0)
                goal['current'] = min(subjects_used, goal['target'])
        
        return jsonify({
            'goals': goals,
            'timestamp': time.time()
        }), 200
    except Exception as e:
        app.logger.error(f"Error getting learning goals: {str(e)}")
        return jsonify({
            'goals': [],
            'error': str(e)
        }), 500

@app.route("/api/dashboard/activity", methods=["GET"])
def get_recent_activity():
    """Get recent user activity"""
    try:
        # Return last 10 activities
        recent_activities = user_stats['activities'][-10:] if user_stats['activities'] else []
        return jsonify({
            'activities': recent_activities,
            'timestamp': time.time()
        }), 200
    except Exception as e:
        app.logger.error(f"Error getting recent activity: {str(e)}")
        return jsonify({
            'activities': [],
            'error': str(e)
        }), 500

@app.route("/api/dashboard/track", methods=["POST"])
def track_user_interaction():
    """Track user interaction and update stats"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        interaction_type = data.get('type', '')
        interaction_data = data.get('data', {})
        timestamp = data.get('timestamp', time.time())
        
        # Update stats based on interaction type
        if interaction_type == 'chat':
            user_stats['total_chats'] += 1
            user_stats['activities'].append({
                'type': 'chat',
                'description': 'Started a new conversation',
                'timestamp': timestamp
            })
        elif interaction_type == 'search':
            user_stats['total_questions'] += 1
            subject = interaction_data.get('subject', 'Others')
            if subject in user_stats['subjects']:
                user_stats['subjects'][subject] += 1
            else:
                user_stats['subjects']['Others'] += 1
            
            user_stats['activities'].append({
                'type': 'search',
                'description': f'Asked a question about {subject}',
                'timestamp': timestamp
            })
            
            # Check for achievements
            check_achievements()
            
        elif interaction_type == 'mcq_attempt':
            user_stats['total_mcq_attempted'] += 1
            is_correct = interaction_data.get('correct', False)
            if is_correct:
                user_stats['mcq_correct'] += 1
            else:
                user_stats['mcq_wrong'] += 1
            
            user_stats['activities'].append({
                'type': 'mcq',
                'description': f'Answered MCQ {"correctly" if is_correct else "incorrectly"}',
                'timestamp': timestamp
            })
            
            # Check for achievements
            check_achievements()
        
        # Keep only last 50 activities
        if len(user_stats['activities']) > 50:
            user_stats['activities'] = user_stats['activities'][-50:]
        
        return jsonify({
            'success': True,
            'message': 'Interaction tracked successfully'
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error tracking interaction: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route("/api/dashboard/update-stats", methods=["POST"])
def update_user_stats():
    """Update user statistics"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update stats with provided data
        for key, value in data.items():
            if key in user_stats and isinstance(value, (int, float)):
                user_stats[key] = value
        
        return jsonify({
            'success': True,
            'message': 'Stats updated successfully'
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error updating stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def check_achievements():
    """Check and add new achievements based on current stats"""
    try:
        achievements_to_add = []
        
        # First question achievement
        if user_stats['total_questions'] == 1 and not any(a['id'] == 'first_question' for a in user_stats['achievements']):
            achievements_to_add.append({
                'id': 'first_question',
                'title': 'First Question!',
                'description': 'Asked your first question',
                'icon': '🎯',
                'date': 'Just now'
            })
        
        # 10 questions milestone
        if user_stats['total_questions'] >= 10 and not any(a['id'] == 'ten_questions' for a in user_stats['achievements']):
            achievements_to_add.append({
                'id': 'ten_questions',
                'title': 'Curious Mind!',
                'description': 'Asked 10 questions',
                'icon': '🧠',
                'date': 'Just now'
            })
        
        # First MCQ attempt
        if user_stats['total_mcq_attempted'] == 1 and not any(a['id'] == 'first_mcq' for a in user_stats['achievements']):
            achievements_to_add.append({
                'id': 'first_mcq',
                'title': 'Quiz Starter!',
                'description': 'Attempted your first MCQ',
                'icon': '📝',
                'date': 'Just now'
            })
        
        # 50% accuracy with at least 10 MCQs
        if user_stats['total_mcq_attempted'] >= 10:
            accuracy = (user_stats['mcq_correct'] / user_stats['total_mcq_attempted']) * 100
            if accuracy >= 50 and not any(a['id'] == 'half_accurate' for a in user_stats['achievements']):
                achievements_to_add.append({
                    'id': 'half_accurate',
                    'title': 'Getting Better!',
                    'description': 'Achieved 50% MCQ accuracy',
                    'icon': '📈',
                    'date': 'Just now'
                })
        
        # Add new achievements
        user_stats['achievements'].extend(achievements_to_add)
        
        # Keep only last 20 achievements
        if len(user_stats['achievements']) > 20:
            user_stats['achievements'] = user_stats['achievements'][-20:]
            
    except Exception as e:
        app.logger.error(f"Error checking achievements: {str(e)}")

# ============================================
# PYQ Practice API Endpoints
# ============================================

@app.route("/api/pyq/search", methods=["POST"])
@rate_limit(max_requests=30, window_seconds=60)
def search_pyq_questions():
    """Search and filter PYQ questions"""
    global search_components
    
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    
    try:
        data = request.get_json()
        query = data.get('query', '')
        exam_filter = data.get('exam', None)
        subject_filter = data.get('subject', None)
        year_filter = data.get('year', None)
        limit = data.get('limit', 50)
        
        mcq_index = search_components.get('mcq_index')
        mcq_model = search_components.get('mcq_model')
        
        if not mcq_index or not mcq_model:
            return jsonify({"error": "MCQ system not available"}), 500
        
        # Get all available namespaces
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        namespaces = list(stats.namespaces.keys()) if stats.namespaces else []
        
        all_questions = []
        
        # Limit namespaces to query based on filters to speed up
        target_namespaces = namespaces
        if exam_filter and exam_filter != 'all':
            # Try to match namespace to exam filter
            target_namespaces = [ns for ns in namespaces if exam_filter.lower().replace('_', ' ') in ns.lower()]
            if not target_namespaces:
                target_namespaces = namespaces  # fallback to all if no match
        
        # Precompute embedding once for all namespaces
        mcq_model = search_components.get('mcq_model')
        if query:
            query_embedding = encode_query(mcq_model, query)
        else:
            query_embedding = encode_query(mcq_model, "general knowledge question")

        # Query each namespace (limited for performance)
        for namespace in target_namespaces[:5]:  # Limit to first 5 namespaces for speed
            try:
                results = safe_pinecone_query(
                    mcq_index,
                    query_embedding,
                    top_k=min(limit + 10, 100),  # Reduced from 500 to 100 for faster queries
                    include_metadata=True,
                    namespace=namespace
                )
                
                for match in results['matches']:
                    metadata = match.get('metadata', {})
                    
                    # Parse full_json_str if available
                    full_data = {}
                    if 'full_json_str' in metadata:
                        try:
                            full_data = json.loads(metadata['full_json_str'])
                        except:
                            pass
                    
                    # Extract fields
                    exam_name = full_data.get('exam_name', metadata.get('exam_name', ''))
                    exam_year = str(full_data.get('exam_year', metadata.get('exam_year', '')))
                    exam_term = full_data.get('exam_term', metadata.get('exam_term', ''))
                    subject = full_data.get('subject', metadata.get('subject', ''))
                    question_text = full_data.get('question', metadata.get('question', ''))
                    explanation = full_data.get('explanation', metadata.get('explanation', ''))
                    correct_option = full_data.get('correct_option', metadata.get('correct_option', ''))
                    
                    # Get options
                    options_dict = full_data.get('options', {})
                    if not options_dict:
                        options_dict = {}
                        for opt_key in ['option_a', 'option_b', 'option_c', 'option_d']:
                            if metadata.get(opt_key):
                                options_dict[opt_key.replace('option_', '').upper()] = metadata.get(opt_key)
                    
                    # Extract options list - handle both uppercase and lowercase keys
                    options_list = []
                    for k in ['A', 'B', 'C', 'D']:
                        # Try uppercase first, then lowercase
                        opt_value = options_dict.get(k) or options_dict.get(k.lower())
                        if opt_value:
                            options_list.append(opt_value)
                    
                    # Map correct_option letter to index
                    correct_answer_index = None
                    if correct_option:
                        option_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3}
                        correct_answer_index = option_map.get(correct_option)
                    
                    # Apply filters
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
                    
                    # Build question object
                    question_obj = {
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
                    }
                    
                    all_questions.append(question_obj)
                    
            except Exception as e:
                app.logger.warning(f"Error querying namespace {namespace}: {str(e)}")
                continue
        
        # Sort by score and limit
        all_questions.sort(key=lambda x: x['score'], reverse=True)
        filtered_questions = all_questions[:limit]
        
        return jsonify({
            'questions': filtered_questions,
            'total': len(filtered_questions),
            'status': 'success'
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error searching PYQ questions: {str(e)}")
        return jsonify({
            'error': str(e),
            'questions': [],
            'total': 0
        }), 500


@app.route("/api/pyq/filters", methods=["GET"])
@rate_limit(max_requests=20, window_seconds=60)
def get_pyq_filters():
    """Get available filter options for PYQ practice"""
    global search_components
    
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    
    try:
        mcq_index = search_components.get('mcq_index')
        mcq_model = search_components.get('mcq_model')
        
        if not mcq_index or not mcq_model:
            return jsonify({"error": "MCQ system not available"}), 500
        
        # Get all namespaces
        stats = _get_index_stats_cached(mcq_index, 'mcq_index_stats', ttl_seconds=60)
        namespaces = list(stats.namespaces.keys()) if stats.namespaces else []
        
        exams_set = set()
        subjects_set = set()
        years_set = set()

        def _is_placeholder_exam(name: str) -> bool:
            value = str(name or "").strip().lower()
            return ("coming soon" in value) or value in {"tbd", "to be announced"}
        
        # Sample questions from each namespace to get filters
        mcq_model = search_components.get('mcq_model')
        dummy_query = encode_query(mcq_model, "sample")
        
        for namespace in namespaces:
            try:
                results = safe_pinecone_query(
                    mcq_index,
                    dummy_query,
                    top_k=100,
                    include_metadata=True,
                    namespace=namespace
                )
                
                for match in results['matches']:
                    metadata = match.get('metadata', {})
                    
                    # Parse full_json_str
                    full_data = {}
                    if 'full_json_str' in metadata:
                        try:
                            full_data = json.loads(metadata['full_json_str'])
                        except:
                            pass
                    
                    exam_name = full_data.get('exam_name', metadata.get('exam_name', ''))
                    exam_year = str(full_data.get('exam_year', metadata.get('exam_year', '')))
                    subject = full_data.get('subject', metadata.get('subject', ''))
                    
                    if exam_name and not _is_placeholder_exam(exam_name):
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
        app.logger.error(f"Error getting PYQ filters: {str(e)}")
        return jsonify({
            'error': str(e),
            'exams': [],
            'subjects': [],
            'years': []
        }), 500


@app.route("/api/pyq/random", methods=["POST"])
@rate_limit(max_requests=30, window_seconds=60)
def get_random_pyq_questions():
    """Get random PYQ questions with optional filters"""
    global search_components
    
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500
    
    try:
        data = request.get_json()
        count = data.get('count', 10)
        exam_filter = data.get('exam', None)
        subject_filter = data.get('subject', None)
        year_filter = data.get('year', None)
        
        # Use the search endpoint with a generic query
        search_data = {
            'query': '',
            'exam': exam_filter,
            'subject': subject_filter,
            'year': year_filter,
            'limit': count * 2  # Get more than needed for randomization
        }
        
        # Call the search function internally
        import random
        request._cached_json = search_data
        response, status = search_pyq_questions()
        
        if status == 200:
            result = response.get_json()
            questions = result.get('questions', [])
            
            # Randomize and limit
            random.shuffle(questions)
            random_questions = questions[:count]
            
            return jsonify({
                'questions': random_questions,
                'status': 'success'
            }), 200
        else:
            return response, status
            
    except Exception as e:
        app.logger.error(f"Error getting random PYQ questions: {str(e)}")
        return jsonify({
            'error': str(e),
            'questions': []
        }), 500


@app.route("/api/pyq/explain", methods=["POST"])
@rate_limit(max_requests=40, window_seconds=60)
def generate_pyq_explanation():
    """Generate AI explanation for a PYQ using question + options + correct answer."""
    if not system_initialized:
        return jsonify({"error": "Search system not initialized"}), 500

    try:
        request_id = uuid.uuid4().hex[:12]
        started_at = time.time()
        data = request.get_json(silent=True) or {}
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

        if not isinstance(options, list):
            options = []
        options = [str(option).strip()[:350] for option in options[:4] if str(option).strip()]

        option_labels = ['A', 'B', 'C', 'D']

        if not correct_answer_text:
            try:
                if isinstance(correct_answer, int) and 0 <= correct_answer < len(options):
                    correct_answer_text = str(options[correct_answer]).strip()
                elif isinstance(correct_answer, str) and correct_answer.isdigit():
                    idx = int(correct_answer)
                    if 0 <= idx < len(options):
                        correct_answer_text = str(options[idx]).strip()
            except Exception:
                correct_answer_text = ''

        if not correct_answer_text and correct_option:
            option_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3}
            idx = option_map.get(correct_option)
            if idx is not None and idx < len(options):
                correct_answer_text = str(options[idx]).strip()

        if not correct_answer_text:
            correct_answer_text = 'Not provided'

        option_lines = []
        for idx, option in enumerate(options[:4]):
            label = option_labels[idx] if idx < len(option_labels) else f'Option {idx + 1}'
            option_lines.append(f"{label}) {option}")

        options_block = "\n".join(option_lines) if option_lines else "Options not provided"

        cache_key_payload = {
            'question': question,
            'options': options[:4],
            'correct_answer': correct_answer,
            'correct_option': correct_option,
            'correct_answer_text': correct_answer_text,
            'subject': subject,
            'exam_name': exam_name
        }
        stable_hash = hashlib.sha256(json.dumps(cache_key_payload, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest()
        explanation_cache_key = f"pyqexp:{stable_hash}"

        cached_explanation = _get_cached_value(explanation_cache_key)
        if cached_explanation:
            return jsonify({
                'status': 'success',
                'provider': 'cache',
                'explanation': cached_explanation,
                'request_id': request_id,
                'elapsed_ms': int((time.time() - started_at) * 1000),
            }), 200

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

        # 1) Primary: OpenAI
        openai_client = search_components.get('openai_client')
        if openai_client:
            try:
                response = openai_client.chat.completions.create(
                    model=search_components.get('openai_model', 'gpt-4o-mini'),
                    messages=[
                        {"role": "system", "content": "You are a precise educational assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    max_tokens=140,
                    temperature=0.2,
                    top_p=0.9,
                    timeout=int(os.getenv('OPENAI_TIMEOUT_SECONDS', '20')),
                )
                content = (response.choices[0].message.content or '').strip()
                if content:
                    _set_cached_value(explanation_cache_key, content, ttl_seconds=86400)
                    return jsonify({
                        'status': 'success',
                        'provider': 'openai',
                        'explanation': content,
                        'request_id': request_id,
                        'elapsed_ms': int((time.time() - started_at) * 1000),
                    }), 200
            except Exception as e:
                app.logger.warning(f"OpenAI PYQ explanation failed, trying fallback: {e}")

        # 2) Fallback: Groq
        groq_client = search_components.get('client')
        if groq_client:
            try:
                response = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a precise educational assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    model=search_components.get('groq_model', os.getenv('GROQ_MODEL_NAME', 'llama-3.1-8b-instant')),
                    max_tokens=140,
                    temperature=0.2,
                    top_p=0.9,
                )
                content = (response.choices[0].message.content or '').strip()
                if content:
                    _set_cached_value(explanation_cache_key, content, ttl_seconds=86400)
                    return jsonify({
                        'status': 'success',
                        'provider': 'groq',
                        'explanation': content,
                        'request_id': request_id,
                        'elapsed_ms': int((time.time() - started_at) * 1000),
                    }), 200
            except Exception as e:
                app.logger.warning(f"Groq PYQ explanation failed: {e}")

        fallback_explanation = existing_explanation or (
            f"Correct answer: {correct_answer_text}. "
            "AI explanation is temporarily unavailable. Please try again shortly."
        )
        return jsonify({
            'status': 'fallback',
            'provider': 'none',
            'explanation': fallback_explanation,
            'request_id': request_id,
            'elapsed_ms': int((time.time() - started_at) * 1000),
        }), 200

    except Exception as e:
        app.logger.error(f"Error generating PYQ explanation: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    # Initialize the search system before starting the app
    initialize_search_system()
    
    is_production = os.getenv('FLASK_ENV') == 'production'
    port = int(os.getenv('PORT', 5000))
    
    if is_production:
        app.logger.info("🚀 Starting Flask API server in PRODUCTION mode...")
        app.logger.info(f"📡 CORS enabled for origins: {ALLOWED_ORIGINS}")
        app.logger.info(f"🔗 Server running on port {port}")
    else:
        print("🚀 Starting Flask API server in DEVELOPMENT mode...")
        print("📡 CORS enabled for React frontend")
        print("🔗 API endpoints:")
        print("   - POST /api/search - Search queries")
        print("   - GET /api/total-questions - Total questions count")
        print("   - GET /api/stats - System statistics")
        print("   - GET /api/health - Health check")
        print("   - GET /api/questions - Get questions with filtering")
        print("   - GET /api/filters - Get unique exam names and subjects for dropdowns")
        print("   - GET /api/books - Get inserted books")
        print("   - GET /api/inserted-pyqs - Get inserted PYQs")
        print("   - POST /api/pyq/search - Search PYQ questions with filters")
        print("   - GET /api/pyq/filters - Get available PYQ filter options")
        print("   - POST /api/pyq/random - Get random PYQ questions")
        print("   - GET /api/dashboard/stats - Dashboard statistics")
        print("   - GET /api/dashboard/subjects - Subject-wise stats")
        print("   - GET /api/dashboard/achievements - User achievements")
        print("   - GET /api/dashboard/goals - Learning goals")
        print("   - GET /api/dashboard/activity - Recent activity")
        print("   - POST /api/dashboard/track - Track user interaction")
        print("   - POST /api/dashboard/update-stats - Update user stats")
    
    # In production, Gunicorn will handle the server
    # This is only for local development
    if not is_production:
        app.run(host="0.0.0.0", port=port, debug=True)
    else:
        # For production, just initialize and let Gunicorn handle it
        app.logger.info("✅ Application ready for Gunicorn")

