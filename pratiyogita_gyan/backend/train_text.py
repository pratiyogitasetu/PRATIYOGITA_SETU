#!/usr/bin/env python3
"""
Text Training Module - RAG System
Processes and uploads text files (.txt) to Pinecone for semantic search
Extracted from CM.ipynb - Text processing and indexing functionality
"""

# Import all required libraries
import sys
from semantic_text_splitter import TextSplitter
from tokenizers import Tokenizer
import os
from pinecone import Pinecone
from pinecone import ServerlessSpec
from sentence_transformers import SentenceTransformer
from openai import OpenAI
import time
import shutil
import json
import re
from collections import deque
from dotenv import load_dotenv


ROMAN_CLASS_MAP = {
    "VI": 6,
    "VII": 7,
    "VIII": 8,
    "IX": 9,
    "X": 10,
    "XI": 11,
    "XII": 12,
}

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
TRAINING_STOP_FILE = os.getenv("TRAINING_STOP_FILE", os.path.join(PROJECT_ROOT, ".training_emergency_stop"))
EMBEDDING_PROVIDER_ENV = os.getenv("EMBEDDING_PROVIDER", "local").lower()

TRAINING_GUARD_MODE = os.getenv("ENABLE_TRAINING_GUARD", "auto").lower()
if TRAINING_GUARD_MODE == "auto":
    TRAINING_GUARD_ENABLED = EMBEDDING_PROVIDER_ENV == "openai"
else:
    TRAINING_GUARD_ENABLED = TRAINING_GUARD_MODE in ("1", "true", "yes", "on")

TRAINING_GUARD = {
    "day_key": time.strftime("%Y-%m-%d"),
    "tokens_today": 0,
    "requests_minute": deque(),
}

MAX_TRAIN_EMBED_TOKENS_PER_DAY = int(os.getenv("MAX_TRAIN_EMBED_TOKENS_PER_DAY", "400000"))
MAX_TRAIN_EMBED_REQUESTS_PER_MIN = int(os.getenv("MAX_TRAIN_EMBED_REQUESTS_PER_MIN", "40"))


def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, len(text) // 4)


def is_training_stopped() -> bool:
    if not TRAINING_GUARD_ENABLED:
        return False
    return os.path.exists(TRAINING_STOP_FILE)


def consume_training_budget(texts):
    """Guard OpenAI training embedding usage by per-minute and daily limits."""
    if not TRAINING_GUARD_ENABLED:
        return

    now = time.time()
    day_key = time.strftime("%Y-%m-%d")

    if TRAINING_GUARD["day_key"] != day_key:
        TRAINING_GUARD["day_key"] = day_key
        TRAINING_GUARD["tokens_today"] = 0

    minute_q = TRAINING_GUARD["requests_minute"]
    while minute_q and now - minute_q[0] > 60:
        minute_q.popleft()

    if len(minute_q) >= MAX_TRAIN_EMBED_REQUESTS_PER_MIN:
        raise RuntimeError("Training embed request/minute limit exceeded")

    estimated = sum(estimate_tokens(t) for t in texts)
    projected = TRAINING_GUARD["tokens_today"] + estimated
    if projected > MAX_TRAIN_EMBED_TOKENS_PER_DAY:
        raise RuntimeError("Training embed daily token limit exceeded")

    minute_q.append(now)
    TRAINING_GUARD["tokens_today"] = projected


def normalize_class_label(class_value: str):
    """Normalize class labels like 'CLASS – 9TH', 'Class IX', '9' to canonical forms."""
    if class_value is None:
        return None, None, None

    original = str(class_value).strip()
    if not original:
        return None, None, None

    cleaned = original.upper()
    cleaned = (
        cleaned.replace("–", "-")
        .replace("—", "-")
        .replace("_", " ")
    )
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    roman_match = re.search(r"\b(VI{0,2}|IX|XI{0,1}|XII|X|VII|VIII)\b", cleaned)
    if roman_match:
        roman = roman_match.group(1)
        class_num = ROMAN_CLASS_MAP.get(roman)
        if class_num:
            return class_num, f"Class {class_num}", f"class-{class_num}"

    digit_match = re.search(r"\b(6|7|8|9|10|11|12)\s*(?:ST|ND|RD|TH)?\b", cleaned)
    if digit_match:
        class_num = int(digit_match.group(1))
        return class_num, f"Class {class_num}", f"class-{class_num}"

    return None, None, None

def load_api_keys():
    """Load API keys from environment variables."""
    # Load environment variables from .env file
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(env_path)

    pine_api_key = os.getenv('PINECONE_API_KEY')
    openai_api_key = os.getenv('OPENAI_API_KEY')
    embedding_provider = os.getenv('EMBEDDING_PROVIDER', 'local').lower()

    if not pine_api_key:
        raise ValueError("PINECONE_API_KEY not found in environment variables. Please set it in your .env file.")

    if embedding_provider == 'openai' and not openai_api_key:
        raise ValueError("OPENAI_API_KEY not found but EMBEDDING_PROVIDER=openai. Please set it in your .env file.")

    print(f"✅ API keys loaded successfully (provider={embedding_provider})")
    return {
        "pinecone": pine_api_key,
        "openai": openai_api_key,
        "provider": embedding_provider,
    }

def initialize_rag_system(api_keys):
    """Initialize Pinecone and embedding model/client for RAG."""
    pine_api_key = api_keys["pinecone"]
    provider = api_keys["provider"]

    pc_rag = Pinecone(api_key=pine_api_key)
    if provider == 'openai':
        rag_index_name = os.getenv('RAG_INDEX_NAME', 'ncert-openai')
        rag_dimension = int(os.getenv('RAG_INDEX_DIMENSION', '1536'))
        openai_model = os.getenv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small')
        rag_embedder = {
            "provider": "openai",
            "client": OpenAI(api_key=api_keys["openai"]),
            "model": openai_model,
        }
    else:
        rag_index_name = os.getenv('RAG_INDEX_NAME', 'ncert')
        local_embedding_model = os.getenv('LOCAL_EMBEDDING_MODEL', 'BAAI/bge-base-en-v1.5')
        local_model = SentenceTransformer(local_embedding_model)
        rag_dimension = int(os.getenv('RAG_INDEX_DIMENSION', '0'))
        if rag_dimension <= 0:
            rag_dimension = len(local_model.encode(["dimension probe"]).tolist()[0])
        rag_embedder = {
            "provider": "local",
            "model": local_model,
        }

    indexes = pc_rag.list_indexes()
    index_names = [index.name for index in indexes]
    
    if rag_index_name not in index_names:
        print(f"Creating new RAG index '{rag_index_name}'...")
        pc_rag.create_index(
            name=rag_index_name, 
            dimension=rag_dimension,
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        # Wait for index to be ready
        while not pc_rag.describe_index(rag_index_name).status['ready']:
            time.sleep(1)
        print(f"✅ RAG Index '{rag_index_name}' created successfully.")
    else:
        print(f"✅ RAG Index '{rag_index_name}' already exists.")
    
    rag_index = pc_rag.Index(rag_index_name)
    print(f"✅ Embedding provider initialized: {provider}")

    return rag_index, rag_embedder


def generate_embeddings(embedder, texts):
    """Generate embeddings using local sentence-transformer or OpenAI embeddings API."""
    if embedder["provider"] == "openai":
        if is_training_stopped():
            raise RuntimeError(f"Training stopped by emergency file: {TRAINING_STOP_FILE}")
        consume_training_budget(texts)

        response = embedder["client"].embeddings.create(
            model=embedder["model"],
            input=texts,
        )
        return [item.embedding for item in response.data]

    return embedder["model"].encode(texts).tolist()

def initialize_text_processing():
    """Initialize tokenizer and text splitter"""
    tokenizer = Tokenizer.from_pretrained("bert-large-cased-whole-word-masking")
    text_splitter = TextSplitter.from_huggingface_tokenizer(tokenizer, 500)
    return tokenizer, text_splitter

# RAG file reading and splitting utilities
def read_text_file(file_path: str):
    """Read text file with encoding fallback"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()
        return text
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='latin-1') as file:
            text = file.read()
        return text

def read_document(file_path: str):
    """Read document based on file extension"""
    _, file_extension = os.path.splitext(file_path)
    file_extension = file_extension.lower()
    
    if file_extension == '.txt':
        return read_text_file(file_path)
    elif file_extension == '.json':
        return read_json_file(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_extension}. Supported formats: .txt, .json")

def read_json_file(file_path: str):
    """Read JSON file with encoding fallback"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        return data
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='latin-1') as file:
            data = json.load(file)
        return data

def split_text(text: str, text_splitter, tokenizer, max_tokens: int = 500):
    """Split text into chunks"""
    if max_tokens != 500:
        custom_splitter = TextSplitter.from_huggingface_tokenizer(tokenizer, max_tokens)
        chunks = custom_splitter.chunks(text)
    else:
        chunks = text_splitter.chunks(text)
    return chunks


def resolve_content_json_dir():
    """Resolve content JSON directory across legacy/new layouts."""
    base = os.path.dirname(os.path.dirname(__file__))
    candidates = [
        os.path.join(base, "CONTENT", "content_data"),
        os.path.join(base, "data", "ncert"),
    ]
    for path in candidates:
        if os.path.isdir(path):
            return path
    return candidates[0]


def resolve_content_txt_dir():
    """Resolve text directory across legacy/new layouts."""
    base = os.path.dirname(os.path.dirname(__file__))
    candidates = [
        os.path.join(base, "DATA_TRAINING", "text_train"),
        os.path.join(base, "data", "ncert"),
    ]
    for path in candidates:
        if os.path.isdir(path):
            return path
    return candidates[0]

# Pinecone document processing and upload
def process_document(file_path: str, text_splitter, tokenizer):
    """Process a single document into chunks with metadata"""
    try:
        content = read_document(file_path)
        _, file_extension = os.path.splitext(file_path)
        file_extension = file_extension.lower()
        
        if file_extension == '.txt':
            return process_text_document(content, file_path, text_splitter, tokenizer)
        elif file_extension == '.json':
            return process_json_document(content, file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    except Exception as e:
        print(f"❌ Error processing {file_path}: {str(e)}")
        return [], [], []

def process_text_document(content: str, file_path: str, text_splitter, tokenizer):
    """Process text document into chunks"""
    chunks = split_text(content, text_splitter, tokenizer)
    file_name = os.path.basename(file_path)
    metadatas = [{"source": file_name, "chunk": i, "text": chunk} for i, chunk in enumerate(chunks)]
    ids = [f"{file_name}_chunk_{i}" for i in range(len(chunks))]
    return ids, chunks, metadatas

def process_json_document(content: list, file_path: str):
    """Process JSON document - each JSON object becomes one chunk"""
    file_name = os.path.basename(file_path)
    ids = []
    texts = []
    metadatas = []
    
    for i, json_obj in enumerate(content):
        # Use the object's ID if available, otherwise generate one
        obj_id = json_obj.get('id', f"{file_name}_obj_{i}")
        
        # Convert the entire JSON object to text for embedding
        json_text = json.dumps(json_obj, ensure_ascii=False, indent=2)
        
        # Create metadata that includes both the original metadata and additional info
        metadata = {
            "source": file_name,
            "chunk": i,
            "text": json_text,
            "object_id": obj_id,
            "type": "json_object"
        }

        raw_class_value = None
        if isinstance(json_obj, dict) and isinstance(json_obj.get('metadata'), dict):
            raw_class_value = json_obj['metadata'].get('class')

        class_num, class_display, class_normalized = normalize_class_label(raw_class_value)
        if raw_class_value:
            metadata["class_raw"] = str(raw_class_value)
        if class_display:
            metadata["class"] = class_display
        if class_num:
            metadata["class_num"] = class_num
        if class_normalized:
            metadata["class_normalized"] = class_normalized
        
        # If the JSON object has metadata field, merge it but flatten nested objects
        if 'metadata' in json_obj and isinstance(json_obj['metadata'], dict):
            for key, value in json_obj['metadata'].items():
                # Don't overwrite source field if the value is empty or None
                if key == 'source' and (not value or value == ""):
                    continue
                # Keep normalized class fields consistent
                if key == 'class':
                    continue
                    
                # Convert nested objects to JSON strings
                if isinstance(value, (dict, list)):
                    metadata[key] = json.dumps(value, ensure_ascii=False)
                else:
                    metadata[key] = value
        
        ids.append(f"{file_name}_json_{i}")
        texts.append(json_text)
        metadatas.append(metadata)
    
    print(f"   📊 Processed {len(texts)} JSON objects from {file_name}")
    return ids, texts, metadatas

def add_to_pinecone(index, rag_embedder, ids, texts, metadatas, namespace: str = ""):
    """Add processed chunks to Pinecone index"""
    if not texts:
        print("⚠️ No texts to add to Pinecone")
        return
    
    # Use smaller batch size for high-dimensional embeddings to avoid Pinecone 2MB limit
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        if is_training_stopped():
            raise RuntimeError(f"Training stopped by emergency file: {TRAINING_STOP_FILE}")

        end_idx = min(i + batch_size, len(texts))
        
        # Generate embeddings for this batch
        embeddings = generate_embeddings(rag_embedder, texts[i:end_idx])
        
        # Prepare data for Pinecone
        pinecone_data = [
            (ids[i + k], embeddings[k], metadatas[i + k])
            for k in range(end_idx - i)
        ]
        
        # Upsert to Pinecone
        if namespace:
            index.upsert(vectors=pinecone_data, namespace=namespace)
        else:
            index.upsert(vectors=pinecone_data)
        
        print(f"   📤 Uploaded batch {i//batch_size + 1}: {end_idx - i} chunks")

def process_and_add_documents_to_pinecone(index, rag_embedder, text_splitter, tokenizer, file_path: str, namespace: str = ""):
    """Process and add a document to Pinecone index"""
    print(f"🔄 Processing {os.path.basename(file_path)} into namespace '{namespace}'...")
    
    ids, texts, metadatas = process_document(file_path, text_splitter, tokenizer)
    
    if texts:
        add_to_pinecone(index, rag_embedder, ids, texts, metadatas, namespace)
        print(f"✅ Added {len(texts)} chunks to Pinecone index in namespace '{namespace}'")
    else:
        print(f"❌ No content processed for {file_path}")

def train_text_files():
    """Main function to train/index all text files using filename as namespace"""
    print("=" * 60)
    print("🚀 STARTING TEXT TRAINING/INDEXING PROCESS")
    print("=" * 60)
    
    text_dir = os.path.join(os.path.dirname(__file__), "text_train")
    files = [f for f in os.listdir(text_dir) if f.endswith(".txt") and os.path.isfile(os.path.join(text_dir, f))]
    if not files:
        print("❌ No TXT files found in text_train.")
        return
    
    # Load API keys
    api_keys = load_api_keys()
    # Initialize RAG system
    rag_index, rag_embedder = initialize_rag_system(api_keys)
    # Initialize text processing
    tokenizer, text_splitter = initialize_text_processing()
    
    successful_uploads = 0
    failed_uploads = 0
    for txt_file in files:
        txt_path = os.path.join(text_dir, txt_file)
        namespace = os.path.splitext(txt_file)[0]
        try:
            process_and_add_documents_to_pinecone(
                rag_index, rag_embedder, text_splitter, tokenizer, txt_path, namespace
            )
            successful_uploads += 1
        except Exception as e:
            print(f"❌ Error processing {txt_file}: {str(e)}")
            failed_uploads += 1
        print("-" * 40)
    print("=" * 60)
    print("📊 TEXT TRAINING SUMMARY")
    print("=" * 60)
    print(f"✅ Successfully processed: {successful_uploads} files")
    print(f"❌ Failed to process: {failed_uploads} files")
    print(f"📦 Total files attempted: {len(files)}")
    if successful_uploads > 0:
        print(f"\n🎉 Text training completed successfully!")
        print("💡 You can now use search_query.py to search the indexed content.")
    else:
        print(f"\n⚠️ No files were successfully processed.")
    print("=" * 60)

def train_text_files_all():
    """Train/index all TXT files from data/ncert using specific namespaces"""
    print("=" * 60)
    print("🚀 STARTING BULK TEXT TRAINING/INDEXING PROCESS")
    print("=" * 60)
    
    text_dir = resolve_content_txt_dir()
    
    # Define namespace mapping for NCERT files
    namespace_mapping = {
        "geography.txt": "geography",
        "history.txt": "history", 
        "polity.txt": "polity",
        "science.txt": "science",
        "economics.txt": "economics"
    }
    
    files = [f for f in os.listdir(text_dir) if f.endswith(".txt") and os.path.isfile(os.path.join(text_dir, f))]
    if not files:
        print(f"❌ No TXT files found in {text_dir}.")
        return
    
    # Load API keys
    api_keys = load_api_keys()
    # Initialize RAG system
    rag_index, rag_embedder = initialize_rag_system(api_keys)
    # Initialize text processing
    tokenizer, text_splitter = initialize_text_processing()
    
    successful_uploads = 0
    failed_uploads = 0
    
    for txt_file in files:
        txt_path = os.path.join(text_dir, txt_file)
        namespace = namespace_mapping.get(txt_file, txt_file.replace('.txt', ''))
        
        print(f"\n➡️ Processing {txt_file} into namespace '{namespace}'...")
        try:
            process_and_add_documents_to_pinecone(
                rag_index, rag_embedder, text_splitter, tokenizer, txt_path, namespace
            )
            successful_uploads += 1
            print(f"✅ Successfully indexed {txt_file} into namespace '{namespace}'")
        except Exception as e:
            failed_uploads += 1
            print(f"❌ Failed to process {txt_file}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("📊 BULK TEXT TRAINING SUMMARY")
    print("=" * 60)
    print(f"✅ Successfully processed: {successful_uploads} files")
    print(f"❌ Failed to process: {failed_uploads} files")
    print(f"📦 Total files attempted: {len(files)}")
    if successful_uploads > 0:
        print(f"\n🎉 Bulk text training completed successfully!")
        print("💡 Data is now indexed in Pinecone with proper namespaces.")
    else:
        print(f"\n⚠️ No files were successfully processed.")
def train_json_files():
    """Train/index JSON files from content_data/data-ncert using subject namespaces."""
    print("=" * 60)
    print("🚀 STARTING JSON TRAINING/INDEXING PROCESS")
    print("=" * 60)
    
    json_dir = resolve_content_json_dir()
    
    # Define namespace mapping for JSON files
    namespace_mapping = {
        "economics.json": "economics",
        "geography.json": "geography",
        "history.json": "history",
        "polity.json": "polity",
        "science.json": "science",
    }
    
    files = [f for f in os.listdir(json_dir) if f.endswith(".json") and os.path.isfile(os.path.join(json_dir, f))]
    if not files:
        print(f"❌ No JSON files found in {json_dir}.")
        return
    
    # Load API keys
    api_keys = load_api_keys()
    # Initialize RAG system
    rag_index, rag_embedder = initialize_rag_system(api_keys)
    # Initialize text processing (not needed for JSON but keeping for compatibility)
    tokenizer, text_splitter = initialize_text_processing()
    
    successful_uploads = 0
    failed_uploads = 0
    
    for json_file in files:
        json_path = os.path.join(json_dir, json_file)
        namespace = namespace_mapping.get(json_file, json_file.replace('.json', ''))
        
        print(f"\n➡️ Processing {json_file} into namespace '{namespace}'...")
        try:
            process_and_add_documents_to_pinecone(
                rag_index, rag_embedder, text_splitter, tokenizer, json_path, namespace
            )
            successful_uploads += 1
            print(f"✅ Successfully indexed {json_file} into namespace '{namespace}'")
        except Exception as e:
            failed_uploads += 1
            print(f"❌ Failed to process {json_file}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("📊 JSON TRAINING SUMMARY")
    print("=" * 60)
    print(f"✅ Successfully processed: {successful_uploads} files")
    print(f"❌ Failed to process: {failed_uploads} files")
    print(f"📦 Total files attempted: {len(files)}")
    if successful_uploads > 0:
        print(f"\n🎉 JSON training completed successfully!")
        print("💡 Each JSON object is stored as a single chunk with complete metadata.")
    else:
        print(f"\n⚠️ No files were successfully processed.")
    print("=" * 60)

def train_geography_json():
    """Specifically train pro_geography.json into geography namespace"""
    print("=" * 60)
    print("🚀 TRAINING GEOGRAPHY JSON DATA")
    print("=" * 60)
    
    # Path to the specific geography JSON file
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "ncert_json", "pro_geography.json")
    
    if not os.path.exists(json_path):
        print(f"❌ File not found: {json_path}")
        return
    
    # Load API keys
    api_keys = load_api_keys()
    # Initialize RAG system
    rag_index, rag_embedder = initialize_rag_system(api_keys)
    # Initialize text processing (not needed for JSON but keeping for compatibility)
    tokenizer, text_splitter = initialize_text_processing()
    
    namespace = "geography"
    
    print(f"\n➡️ Processing pro_geography.json into namespace '{namespace}'...")
    try:
        process_and_add_documents_to_pinecone(
            rag_index, rag_embedder, text_splitter, tokenizer, json_path, namespace
        )
        print(f"✅ Successfully indexed pro_geography.json into namespace '{namespace}'")
        print(f"\n🎉 Geography JSON training completed successfully!")
        print("💡 Each JSON object is stored as a single chunk with complete educational content metadata.")
    except Exception as e:
        print(f"❌ Failed to process pro_geography.json: {str(e)}")
    
    print("=" * 60)

def retrain_specific_namespace(namespace: str):
    """Retrain a specific namespace with fixed metadata processing"""
    print(f"🔄 Retraining namespace: {namespace}")
    
    # Load API keys
    api_keys = load_api_keys()
    
    # Initialize systems
    rag_index, rag_embedder = initialize_rag_system(api_keys)
    
    content_dir = resolve_content_json_dir()

    # Map namespace to file
    namespace_files = {
        "polity": os.path.join(content_dir, "polity.json"),
        "geography": os.path.join(content_dir, "geography.json"),
        "history": os.path.join(content_dir, "history.json"),
        "economics": os.path.join(content_dir, "economics.json"),
        "science": os.path.join(content_dir, "science.json"),
    }
    
    if namespace not in namespace_files:
        print(f"❌ Unknown namespace: {namespace}")
        return
        
    file_path = namespace_files[namespace]
    
    # Delete existing namespace
    print(f"🗑️ Deleting existing namespace: {namespace}")
    try:
        rag_index.delete(delete_all=True, namespace=namespace)
        print(f"✅ Deleted namespace: {namespace}")
    except Exception as e:
        print(f"⚠️ Could not delete namespace {namespace}: {e}")
    
    # Process and add the file
    print(f"📁 Processing file: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        ids, texts, metadatas = process_json_document(content, file_path)
        
        if texts:
            print(f"📤 Adding {len(texts)} vectors to namespace: {namespace}")
            add_to_pinecone(rag_index, rag_embedder, ids, texts, metadatas, namespace)
            print(f"✅ Successfully retrained namespace: {namespace}")
        else:
            print(f"⚠️ No content to add for namespace: {namespace}")
            
    except Exception as e:
        print(f"❌ Error retraining namespace {namespace}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--retrain":
        if len(sys.argv) > 2:
            namespace = sys.argv[2]
            retrain_specific_namespace(namespace)
        else:
            print("Usage: python train_text.py --retrain <namespace>")
    else:
        # Train all JSON files from data/ncert directory
        train_json_files()
