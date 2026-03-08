#!/usr/bin/env python3
"""
PYQ Training Module - MCQ System
Processes and uploads JSON-based Previous Year Questions (PYQ) to Pinecone for semantic search
Extracted from CM.ipynb - MCQ processing and indexing functionality
"""

# Import all required libraries
import os
import json
import time
import shutil
from pinecone import Pinecone
from pinecone import ServerlessSpec
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# Suppress HuggingFace warnings for cleaner output
import warnings
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', message='.*HF Hub.*')
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Look for .env file in the parent directory (chat root)
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(env_path)
    print(f"📋 Loaded environment variables from {env_path}")
except ImportError:
    print("⚠️ python-dotenv not installed. Please set environment variables manually.")
except Exception as e:
    print(f"⚠️ Could not load .env file: {e}")

def load_api_keys():
    """Load API keys from environment variables (training does not require GROQ)."""
    pine_api_key = os.getenv('PINECONE_API_KEY')

    if not pine_api_key:
        raise ValueError("PINECONE_API_KEY not found in environment variables. Please set it in your .env file.")

    print("✅ Training API keys loaded successfully from environment variables")
    return pine_api_key

def initialize_mcq_system(pine_api_key):
    """Initialize Pinecone and embedding model for MCQ"""
    pc_mcq = Pinecone(api_key=pine_api_key)
    mcq_index_name = 'pyq-bge-768'  # New index with BGE-base embeddings
    
    # Check if index exists
    existing_indexes = [index_info["name"] for index_info in pc_mcq.list_indexes()]
    
    if mcq_index_name not in existing_indexes:
        print(f"Creating new MCQ index '{mcq_index_name}'...")
        pc_mcq.create_index(
            mcq_index_name, 
            dimension=768,  # BGE-base dimension
            metric='dotproduct', 
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
        # Wait for index to be ready
        while not pc_mcq.describe_index(mcq_index_name).status['ready']:
            time.sleep(1)
        print(f"✅ MCQ Index '{mcq_index_name}' created successfully.")
    else:
        print(f"✅ MCQ Index '{mcq_index_name}' already exists.")
    
    mcq_index = pc_mcq.Index(mcq_index_name)
    # Use BGE-base to match RAG system for better quality and consistency
    mcq_model = SentenceTransformer('BAAI/bge-base-en-v1.5', device='cpu')
    
    return mcq_index, mcq_model

# MCQ data utilities
def preprocess_mcq(mcq):
    """Preprocess MCQ data into searchable format"""
    question = mcq["question"]
    options = mcq["options"]
    option_str = " ".join([f"({key}) {val}" for key, val in options.items()])
    exam_details = f"Exam: {mcq.get('exam_name', '')}, Year: {mcq.get('exam_year', '')}, Term: {mcq.get('exam_term', '')}"
    return f"Q: {question} Options: {option_str} {exam_details}"

def load_and_process_mcq_data(json_file_path):
    """Load and process MCQ data from JSON file - preserves complete JSON structure"""
    try:
        print(f"📖 Loading MCQ data from {json_file_path}...")
        with open(json_file_path, 'r', encoding='utf-8') as f:
            mcq_data = json.load(f)
        
        print(f"📊 Processing {len(mcq_data)} MCQ questions...")
        mcq_dataset = []
        
        for mcq in mcq_data:
            try:
                # Preserve COMPLETE original JSON structure - store everything as-is
                processed_mcq = {
                    "text": preprocess_mcq(mcq),  # Keep for search embedding
                    "full_json": mcq,  # Store complete original JSON structure
                }
                # Also extract key fields for easy access while keeping full JSON
                processed_mcq.update({
                    "question": mcq.get("question", ""),
                    "options": mcq.get("options", {}),
                    "correct_option": mcq.get("correct_option", ""),
                    "answer": mcq["options"][mcq["correct_option"]] if "options" in mcq and "correct_option" in mcq and mcq["correct_option"] in mcq["options"] else "",
                    "exam_name": mcq.get("exam_name", ""),
                    "exam_year": mcq.get("exam_year", ""),
                    "exam_term": mcq.get("exam_term", ""),
                    "subject": mcq.get("subject", ""),
                    "correct_answer": mcq.get("correct_answer", ""),
                    "explanation": mcq.get("explanation", ""),
                    "topic": mcq.get("topic", ""),
                    "keyword_and_metadata": mcq.get("keyword_and_metadata", []),
                    "img": mcq.get("img", ""),
                    "sector": mcq.get("sector", ""),
                    "source_url": mcq.get("source_url", "")
                })
                
                mcq_dataset.append(processed_mcq)
            except Exception as e:
                print(f"⚠️ Skipping malformed question - error: {e}")
                continue
        
        print(f"✅ Successfully processed {len(mcq_dataset)} MCQ questions")
        return mcq_dataset
        
    except FileNotFoundError:
        print(f"❌ MCQ file {json_file_path} not found.")
        return []
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing JSON file {json_file_path}: {str(e)}")
        return []
    except Exception as e:
        print(f"❌ Unexpected error loading MCQ data: {str(e)}")
        return []

def flatten_nested_json(json_data):
    """Flatten nested JSON structure to extract all MCQ questions"""
    flattened_questions = []
    
    def extract_questions(data):
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, list) and all(isinstance(item, dict) and 'question' in item for item in value):
                    # This is a list of questions
                    flattened_questions.extend(value)
                elif isinstance(value, (dict, list)):
                    extract_questions(value)
    
    extract_questions(json_data)
    return flattened_questions

def load_and_process_mcq_data_with_namespace(json_file_path, namespace):
    """Load and process MCQ data from JSON file with namespace handling - preserves complete JSON structure"""
    try:
        print(f"📖 Loading MCQ data from {json_file_path}...")
        with open(json_file_path, 'r', encoding='utf-8') as f:
            mcq_data = json.load(f)
        
        # Flatten nested JSON structure
        flattened_questions = flatten_nested_json(mcq_data)
        
        if not flattened_questions:
            print(f"⚠️ No questions found in {json_file_path}")
            return []
        
        print(f"📊 Processing {len(flattened_questions)} MCQ questions...")
        mcq_dataset = []
        
        for mcq in flattened_questions:
            try:
                # Preserve COMPLETE original JSON structure - store everything as-is
                processed_mcq = {
                    "text": preprocess_mcq(mcq),  # Keep for search embedding
                    "full_json": mcq,  # Store complete original JSON structure
                    "namespace": namespace
                }
                # Also extract key fields for easy access while keeping full JSON
                processed_mcq.update({
                    "question": mcq.get("question", ""),
                    "options": mcq.get("options", {}),
                    "correct_option": mcq.get("correct_option", ""),
                    "exam_name": mcq.get("exam_name", ""),
                    "exam_year": mcq.get("exam_year", ""),
                    "exam_term": mcq.get("exam_term", ""),
                    "subject": mcq.get("subject", ""),
                    "correct_answer": mcq.get("correct_answer", ""),
                    "explanation": mcq.get("explanation", ""),
                    "topic": mcq.get("topic", ""),
                    "keyword_and_metadata": mcq.get("keyword_and_metadata", []),
                    "img": mcq.get("img", ""),
                    "sector": mcq.get("sector", ""),
                    "source_url": mcq.get("source_url", "")
                })
                
                mcq_dataset.append(processed_mcq)
            except Exception as e:
                print(f"⚠️ Skipping malformed question - error: {e}")
                continue
        
        print(f"✅ Successfully processed {len(mcq_dataset)} MCQ questions for namespace '{namespace}'")
        return mcq_dataset
        
    except FileNotFoundError:
        print(f"❌ MCQ file {json_file_path} not found.")
        return []
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing JSON file {json_file_path}: {str(e)}")
        return []
    except Exception as e:
        print(f"❌ Unexpected error loading MCQ data: {str(e)}")
        return []

def populate_mcq_index(mcq_dataset, index, mcq_model):
    """Populate Pinecone index with MCQ data - stores complete JSON structure"""
    if not mcq_dataset:
        print("⚠️ No MCQ data to populate.")
        return False
    
    print(f"🔄 Uploading {len(mcq_dataset)} MCQ questions to Pinecone...")
    
    batch_size = 100  # Process in batches for better performance
    successful_uploads = 0
    
    try:
        for batch_start in range(0, len(mcq_dataset), batch_size):
            batch_end = min(batch_start + batch_size, len(mcq_dataset))
            batch = mcq_dataset[batch_start:batch_end]
            
            # Prepare batch data for Pinecone
            batch_vectors = []
            
            for idx, mcq in enumerate(batch):
                global_idx = batch_start + idx
                
                # Generate embedding for the MCQ text
                text_embedding = mcq_model.encode(mcq['text']).tolist()
                
                # Get the complete original JSON structure
                full_json = mcq.get('full_json', {})
                
                # Prepare vector data with COMPLETE JSON structure preserved
                vector_data = {
                    'id': str(global_idx),
                    'values': text_embedding,
                    'metadata': {
                        # Store complete original JSON as string for full preservation
                        'full_json_str': json.dumps(full_json, ensure_ascii=False),
                        
                        # Also store individual fields for easy querying
                        'text': mcq['text'],
                        'question': full_json.get('question', ''),
                        'options': json.dumps(full_json.get('options', {}), ensure_ascii=False),
                        'correct_option': full_json.get('correct_option', ''),
                        'exam_name': full_json.get('exam_name', ''),
                        'exam_year': full_json.get('exam_year', ''),
                        'exam_term': full_json.get('exam_term', ''),
                        'subject': full_json.get('subject', ''),
                        'correct_answer': full_json.get('correct_answer', ''),
                        'explanation': full_json.get('explanation', ''),
                        'topic': full_json.get('topic', ''),
                        'keyword_and_metadata': json.dumps(full_json.get('keyword_and_metadata', []), ensure_ascii=False),
                        'img': full_json.get('img', ''),
                        'sector': full_json.get('sector', ''),
                        'source_url': full_json.get('source_url', '')
                    }
                }
                batch_vectors.append(vector_data)
            
            # Upload batch to Pinecone
            index.upsert(batch_vectors)
            successful_uploads += len(batch_vectors)
            
            print(f"   📤 Uploaded batch {batch_start//batch_size + 1}: {len(batch_vectors)} MCQs")
        
        print(f"✅ Successfully uploaded {successful_uploads} MCQ questions to Pinecone")
        print(f"💾 Complete JSON structure preserved in 'full_json_str' field")
        return True
        
    except Exception as e:
        print(f"❌ Error uploading MCQ data to Pinecone: {str(e)}")
        return False

def populate_mcq_index_with_namespace(mcq_dataset, index, mcq_model, namespace):
    """Populate Pinecone index with MCQ data using namespace - stores complete JSON structure"""
    if not mcq_dataset:
        print("⚠️ No MCQ data to populate.")
        return False
    
    print(f"🔄 Uploading {len(mcq_dataset)} MCQ questions to Pinecone namespace '{namespace}'...")
    
    batch_size = 100  # Process in batches for better performance
    successful_uploads = 0
    
    try:
        for batch_start in range(0, len(mcq_dataset), batch_size):
            batch_end = min(batch_start + batch_size, len(mcq_dataset))
            batch = mcq_dataset[batch_start:batch_end]
            
            # Prepare batch data for Pinecone
            batch_vectors = []
            
            for idx, mcq in enumerate(batch):
                global_idx = f"{namespace}_{batch_start + idx}"
                
                # Generate embedding for the MCQ text
                text_embedding = mcq_model.encode(mcq['text']).tolist()
                
                # Get the complete original JSON structure
                full_json = mcq.get('full_json', {})
                
                # Prepare vector data with COMPLETE JSON structure preserved
                vector_data = {
                    'id': global_idx,
                    'values': text_embedding,
                    'metadata': {
                        # Store complete original JSON as string for full preservation
                        'full_json_str': json.dumps(full_json, ensure_ascii=False),
                        
                        # Also store individual fields for easy querying
                        'text': mcq['text'],  # For search embedding
                        'question': full_json.get('question', ''),
                        'options': json.dumps(full_json.get('options', {}), ensure_ascii=False),
                        'correct_option': full_json.get('correct_option', ''),
                        'exam_name': full_json.get('exam_name', ''),
                        'exam_year': full_json.get('exam_year', ''),
                        'exam_term': full_json.get('exam_term', ''),
                        'subject': full_json.get('subject', ''),
                        'correct_answer': full_json.get('correct_answer', ''),
                        'explanation': full_json.get('explanation', ''),
                        'topic': full_json.get('topic', ''),
                        'keyword_and_metadata': json.dumps(full_json.get('keyword_and_metadata', []), ensure_ascii=False),
                        'img': full_json.get('img', ''),
                        'sector': full_json.get('sector', ''),
                        'source_url': full_json.get('source_url', ''),
                        'namespace': namespace
                    }
                }
                batch_vectors.append(vector_data)
            
            # Upload batch to Pinecone with namespace
            index.upsert(vectors=batch_vectors, namespace=namespace)
            successful_uploads += len(batch_vectors)
            
            print(f"   📤 Uploaded batch {batch_start//batch_size + 1}: {len(batch_vectors)} MCQs to namespace '{namespace}'")
        
        print(f"✅ Successfully uploaded {successful_uploads} MCQ questions to namespace '{namespace}'")
        print(f"💾 Complete JSON structure preserved in 'full_json_str' field")
        return True
        
    except Exception as e:
        print(f"❌ Error uploading MCQ data to Pinecone namespace '{namespace}': {str(e)}")
        return False

def validate_mcq_data(mcq_dataset, sample_size=3):
    """Validate and show sample MCQ data"""
    if not mcq_dataset:
        print("⚠️ No MCQ data to validate")
        return
    
    print(f"\n📋 MCQ DATA VALIDATION")
    print("-" * 40)
    print(f"Total MCQs: {len(mcq_dataset)}")
    
    # Show sample questions
    print(f"\n📝 Sample MCQs (showing {min(sample_size, len(mcq_dataset))}):")
    for i, mcq in enumerate(mcq_dataset[:sample_size]):
        print(f"\nMCQ {i+1}:")
        print(f"   Text: {mcq['text'][:100]}...")
        print(f"   Answer: {mcq['answer']}")
        print(f"   Exam: {mcq['exam_name']} {mcq['exam_year']}")
        print(f"   Subject: {mcq['subject']}")
    
    # Show statistics
    exam_names = [mcq['exam_name'] for mcq in mcq_dataset if mcq['exam_name'] != 'N/A']
    subjects = [mcq['subject'] for mcq in mcq_dataset if mcq['subject'] != 'N/A']
    
    if exam_names:
        unique_exams = list(set(exam_names))
        print(f"\n📊 Unique exams: {len(unique_exams)} ({', '.join(unique_exams[:5])}{'...' if len(unique_exams) > 5 else ''})")
    
    if subjects:
        unique_subjects = list(set(subjects))
        print(f"📊 Unique subjects: {len(unique_subjects)} ({', '.join(unique_subjects[:5])}{'...' if len(unique_subjects) > 5 else ''})")

def train_pyq_data(json_file_path="questions.json"):
    """Main function to train/index PYQ data"""
    print("=" * 60)
    print("🚀 STARTING PYQ TRAINING/INDEXING PROCESS")
    print("=" * 60)
    
    # Load API keys
    pine_api_key = load_api_keys()
    
    # Initialize MCQ system
    mcq_index, mcq_model = initialize_mcq_system(pine_api_key)
    
    # Load and process MCQ data
    mcq_dataset = load_and_process_mcq_data(json_file_path)
    
    if not mcq_dataset:
        print("❌ No MCQ data loaded. Exiting...")
        return False
    
    # Validate data
    validate_mcq_data(mcq_dataset)
    
    # Populate MCQ index
    print(f"\n🔄 Starting MCQ index population...")
    print("-" * 40)
    
    success = populate_mcq_index(mcq_dataset, mcq_index, mcq_model)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 PYQ TRAINING SUMMARY")
    print("=" * 60)
    
    if success:
        print(f"✅ Successfully indexed: {len(mcq_dataset)} MCQ questions")
        print(f"📦 Source file: {json_file_path}")
        print(f"🎯 Index name: semantic-search-mcq")
        print(f"\n🎉 PYQ training completed successfully!")
        print("💡 You can now use search_query.py to search the indexed MCQs.")
    else:
        print(f"❌ Failed to index MCQ data")
        print(f"⚠️ Please check the error messages above and try again.")
    
    print("=" * 60)
    return success

def get_existing_questions_in_namespace(index, namespace):
    """Get all existing question texts from a specific namespace to check for duplicates"""
    try:
        # Query with dummy vector to get all questions in namespace
        stats = index.describe_index_stats()
        namespace_stats = stats.get('namespaces', {}).get(namespace, {})
        
        if namespace_stats.get('vector_count', 0) == 0:
            return set()  # No existing questions
        
        # Create a dummy query to fetch existing questions
        # We'll use a simple approach: fetch metadata from existing vectors
        dummy_vector = [0.0] * 768  # BGE-base embedding dimension
        
        # Query the namespace to get existing questions
        query_result = index.query(
            vector=dummy_vector,
            top_k=10000,  # Large number to get all existing questions
            include_metadata=True,
            namespace=namespace
        )
        
        # Extract question texts from metadata
        existing_questions = set()
        for match in query_result.get('matches', []):
            question_text = match.get('metadata', {}).get('question', '')
            if question_text:
                existing_questions.add(question_text.strip().lower())
        
        return existing_questions
        
    except Exception as e:
        print(f"⚠️ Warning: Could not check existing questions in namespace '{namespace}': {str(e)}")
        return set()  # Return empty set if there's an error

def filter_new_questions(mcq_dataset, existing_questions):
    """Filter out questions that already exist in the namespace"""
    if not existing_questions:
        return mcq_dataset  # No existing questions, return all
    
    new_questions = []
    for mcq in mcq_dataset:
        question_text = mcq.get('question', '').strip().lower()
        if question_text not in existing_questions:
            new_questions.append(mcq)
    
    return new_questions

def train_pyq_data_all():
    """Train/index all JSON files from PYQ/pyq_data folder using filenames as namespaces"""
    print("=" * 60)
    print("🚀 STARTING PYQ TRAINING/INDEXING PROCESS")
    print("=" * 60)
    
    # Read from PYQ/pyq_data directory
    pyq_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "PYQ", "pyq_data")
    
    if not os.path.exists(pyq_dir):
        print(f"❌ PYQ data directory not found: {pyq_dir}")
        return
    
    files = [f for f in os.listdir(pyq_dir) if f.endswith(".json") and os.path.isfile(os.path.join(pyq_dir, f))]
    if not files:
        print("❌ No JSON files found in PYQ/pyq_data directory.")
        return
    
    # Load API keys and initialize system once
    pine_api_key = load_api_keys()
    mcq_index, mcq_model = initialize_mcq_system(pine_api_key)
    
    successful_uploads = 0
    failed_uploads = 0
    
    for json_file in files:
        json_path = os.path.join(pyq_dir, json_file)
        # Use filename (without .json) as namespace
        namespace = json_file.replace('.json', '')
        
        print(f"\n➡️ Processing {json_file} into namespace '{namespace}'...")
        
        try:
            # Check for existing data in this namespace to avoid duplicates
            existing_questions = get_existing_questions_in_namespace(mcq_index, namespace)
            print(f"📊 Found {len(existing_questions)} existing questions in namespace '{namespace}'")
            
            # Load and process MCQ data
            mcq_dataset = load_and_process_mcq_data_with_namespace(json_path, namespace)
            
            if mcq_dataset:
                # Filter out existing questions to avoid duplicates
                new_questions = filter_new_questions(mcq_dataset, existing_questions)
                
                if new_questions:
                    print(f"📥 Found {len(new_questions)} new questions to upload (skipping {len(mcq_dataset) - len(new_questions)} duplicates)")
                    
                    # Populate MCQ index with namespace for new questions only
                    success = populate_mcq_index_with_namespace(new_questions, mcq_index, mcq_model, namespace)
                    if success:
                        successful_uploads += 1
                        print(f"✅ Successfully indexed {len(new_questions)} new questions from {json_file} into namespace '{namespace}'")
                    else:
                        failed_uploads += 1
                        print(f"❌ Failed to index {json_file}")
                else:
                    print(f"ℹ️ No new questions found in {json_file} - all questions already exist in namespace '{namespace}'")
                    successful_uploads += 1  # Count as successful since no new data needed
            else:
                failed_uploads += 1
                print(f"❌ No data loaded from {json_file}")
        except Exception as e:
            failed_uploads += 1
            print(f"❌ Error processing {json_file}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("📊 PYQ TRAINING SUMMARY")
    print("=" * 60)
    print(f"✅ Successfully processed: {successful_uploads} files")
    print(f"❌ Failed to process: {failed_uploads} files")
    print(f"📦 Total files attempted: {len(files)}")
    if successful_uploads > 0:
        print(f"\n🎉 PYQ training completed successfully!")
        print("💡 Data is now indexed in Pinecone with proper namespaces.")
        print("🔄 Future runs will only upload new questions, avoiding duplicates.")
    else:
        print(f"\n⚠️ No files were successfully processed.")
    print("=" * 60)

def check_existing_data():
    """Check if there's existing data in the MCQ index"""
    try:
        pine_api_key = load_api_keys()
        mcq_index, mcq_model = initialize_mcq_system(pine_api_key)
        
        # Try to get index stats
        stats = mcq_index.describe_index_stats()
        total_vectors = stats.get('total_vector_count', 0)
        namespaces = stats.get('namespaces', {})
        
        print(f"📊 MCQ Index Status:")
        print(f"   Total vectors: {total_vectors}")
        print(f"   Total namespaces: {len(namespaces)}")
        
        if namespaces:
            print(f"\n📋 Namespace Details:")
            for namespace, ns_stats in namespaces.items():
                vector_count = ns_stats.get('vector_count', 0)
                print(f"   📁 {namespace}: {vector_count} questions")
        else:
            print("   No namespaces found (index is empty)")
        
        return total_vectors > 0
        
    except Exception as e:
        print(f"❌ Error checking existing data: {str(e)}")
        return False

if __name__ == "__main__":
    import sys
    # Command line argument support
    if len(sys.argv) > 1:
        if sys.argv[1] == "--check":
            check_existing_data()
        elif sys.argv[1] == "--help":
            print("Usage:")
            print("  python train_pyq.py                    # Train all JSON files from PYQ/pyq_data/")
            print("  python train_pyq.py [json_file_path]   # Train with custom JSON file")
            print("  python train_pyq.py --check            # Check existing data")
            print("  python train_pyq.py --help             # Show this help")
            print("\nNew System Features:")
            print("  - Reads from PYQ/pyq_data/ directory")
            print("  - Uses filenames as Pinecone namespaces")
            print("  - Automatically detects and skips duplicate questions")
            print("  - Only uploads new questions on subsequent runs")
        elif sys.argv[1].endswith('.json'):
            # Custom JSON file path provided
            json_file = sys.argv[1]
            train_pyq_data(json_file)
        else:
            train_pyq_data_all()
    else:
        # Default behavior - train all JSON files from PYQ/pyq_data
        train_pyq_data_all()
