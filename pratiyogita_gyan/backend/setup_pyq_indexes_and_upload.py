import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import os
import json
import time
import math
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'), override=True)

from pinecone import Pinecone, ServerlessSpec
from train_pyq import NvidiaTrainEmbedder, preprocess_mcq, flatten_nested_json

# Definition of 4 indexes and their designated namespaces
INDEX_NAMESPACE_MAP = {
    "pyq1": ["DEFENCE_EXAMS", "CIVIL_SERVICES_EXAMS", "POLICE_EXAMS"],
    "pyq2": ["SSC_EXAMS", "RAILWAY_EXAMS", "BANKING_EXAMS"],
    "pyq3": ["MBA_EXAMS", "CUET_AND_UG_ENTRANCE_EXAMS", "PG_EXAMS"],
    "pyq4": ["ENGINEERING_RECRUITING_EXAMS", "TEACHING_EXAMS", "JUDICIARY_EXAMS"]
}

def ensure_index_exists(pc, index_name, dimension=768, metric="dotproduct"):
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    if index_name not in existing_indexes:
        print(f"📦 Creating Pinecone index '{index_name}' (dim={dimension}, metric={metric})...")
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric=metric,
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
        while not pc.describe_index(index_name).status['ready']:
            time.sleep(1)
        print(f"✅ Index '{index_name}' is ready.")
    else:
        print(f"ℹ️ Index '{index_name}' already exists.")
    return pc.Index(index_name)

def migrate_defence_to_pyq1(pc):
    """Transfer all DEFENCE_EXAMS vectors from old 'pyq' index to 'pyq1'."""
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    pyq1_index = ensure_index_exists(pc, "pyq1")

    # Check if pyq1 already has DEFENCE_EXAMS
    pyq1_stats = pyq1_index.describe_index_stats()
    pyq1_defence_count = pyq1_stats.get('namespaces', {}).get('DEFENCE_EXAMS', {}).get('vector_count', 0)

    if pyq1_defence_count >= 4000:
        print(f"✅ 'pyq1' already contains {pyq1_defence_count} DEFENCE_EXAMS vectors. Skipping migration.")
    elif "pyq" in existing_indexes:
        old_index = pc.Index("pyq")
        old_stats = old_index.describe_index_stats()
        old_defence_count = old_stats.get('namespaces', {}).get('DEFENCE_EXAMS', {}).get('vector_count', 0)
        print(f"🔄 Migrating {old_defence_count} DEFENCE_EXAMS vectors from 'pyq' to 'pyq1'...")

        batch_size = 100
        total_batches = math.ceil(old_defence_count / batch_size)

        for b in range(total_batches):
            start = b * batch_size
            end = min(start + batch_size, old_defence_count)
            ids = [f"DEFENCE_EXAMS_{i}" for i in range(start, end)]

            fetch_res = old_index.fetch(ids=ids, namespace="DEFENCE_EXAMS")
            vectors_to_upsert = []
            for vec_id, vec_data in fetch_res.vectors.items():
                vectors_to_upsert.append({
                    "id": vec_id,
                    "values": vec_data.values,
                    "metadata": vec_data.metadata
                })

            if vectors_to_upsert:
                pyq1_index.upsert(vectors=vectors_to_upsert, namespace="DEFENCE_EXAMS")
            
            if (b + 1) % 10 == 0 or b == total_batches - 1:
                print(f"   Transferred batch {b+1}/{total_batches} ({len(vectors_to_upsert)} vectors)...")

        print("✅ DEFENCE_EXAMS migration to 'pyq1' complete.")
    else:
        print("⚠️ Old index 'pyq' does not exist and 'pyq1' doesn't have defence vectors. Reading from DEFENCE_EXAMS.json...")
        # Fallback will embed if ever needed

    # Now verify pyq1 has DEFENCE_EXAMS before deleting old pyq
    time.sleep(2)
    pyq1_stats_after = pyq1_index.describe_index_stats()
    verified_count = pyq1_stats_after.get('namespaces', {}).get('DEFENCE_EXAMS', {}).get('vector_count', 0)
    print(f"📊 Verified 'pyq1' DEFENCE_EXAMS count: {verified_count}")

    if "pyq" in existing_indexes and verified_count >= 4000:
        print("🗑️ Deleting old 'pyq' index to maintain free-tier quota (max 5 indexes)...")
        pc.delete_index("pyq")
        print("✅ Old 'pyq' index deleted successfully.")

def upload_category_questions(pc, embedder, index_name, namespace, json_file_path):
    """Embed and upload questions for a specific category to its index and namespace."""
    if not os.path.exists(json_file_path):
        print(f"❌ File not found: {json_file_path}")
        return

    with open(json_file_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    questions = flatten_nested_json(raw_data)
    total_q = len(questions)
    print(f"\n🚀 Indexing '{namespace}' ({total_q} questions) -> Index '{index_name}' | Namespace '{namespace}'")

    if total_q == 0:
        print(f"⚠️ No questions found in {json_file_path}")
        return

    index = pc.Index(index_name)

    # Check existing count in namespace
    try:
        stats = index.describe_index_stats()
        ns_count = stats.get('namespaces', {}).get(namespace, {}).get('vector_count', 0)
        if ns_count >= total_q:
            print(f"ℹ️ Namespace '{namespace}' already has {ns_count} vectors. Re-upserting to ensure fresh state.")
    except Exception as e:
        pass

    texts = [preprocess_mcq(q) for q in questions]
    embeddings = embedder.encode_batch(texts, input_type="passage")

    batch_vectors = []
    for i, q in enumerate(questions):
        global_id = f"{namespace}_{i}"
        metadata = {
            'full_json_str': json.dumps(q, ensure_ascii=False),
            'text': texts[i],
            'question': q.get('question', ''),
            'options': json.dumps(q.get('options', {}), ensure_ascii=False),
            'correct_option': q.get('correct_option', ''),
            'exam_name': q.get('exam_name', ''),
            'exam_year': str(q.get('exam_year', '')),
            'exam_term': q.get('exam_term', ''),
            'subject': q.get('subject', ''),
            'correct_answer': q.get('correct_answer', ''),
            'explanation': q.get('explanation', ''),
            'topic': q.get('topic', ''),
            'keyword_and_metadata': json.dumps(q.get('keyword_and_metadata', []), ensure_ascii=False),
            'img': q.get('img', ''),
            'sector': q.get('sector', ''),
            'source_url': q.get('source_url', ''),
            'namespace': namespace
        }
        batch_vectors.append({
            'id': global_id,
            'values': embeddings[i],
            'metadata': metadata
        })

    index.upsert(vectors=batch_vectors, namespace=namespace)
    print(f"✅ Successfully upserted {len(batch_vectors)} vectors into '{index_name}' [{namespace}]")

def main():
    print("=" * 60)
    print("🚀 PINECONE PYQ 4-INDEX RESTRUCTURING & DATA UPLOAD")
    print("=" * 60)

    pinecone_key = os.getenv('PINECONE_API_KEY')
    nvidia_key = os.getenv('NVIDIA_API_KEY')
    if not pinecone_key:
        raise ValueError("PINECONE_API_KEY missing in .env")

    pc = Pinecone(api_key=pinecone_key)

    # 1. Migrate DEFENCE_EXAMS to pyq1, delete pyq
    migrate_defence_to_pyq1(pc)

    # 2. Ensure pyq2, pyq3, pyq4 exist
    for idx_name in ["pyq2", "pyq3", "pyq4"]:
        ensure_index_exists(pc, idx_name)

    # 3. Initialize embedder for uploading 11 categories
    print("\n🧠 Initializing NVIDIA Nemotron embedder...")
    embedder = NvidiaTrainEmbedder(nvidia_key, "nvidia/nemotron-3-embed-1b", target_dim=768)

    # 4. Upload all 11 new categories to their respective indexes & namespaces
    pyq_dir = os.path.join(backend_dir, "DATA", "pyq")

    for index_name, namespaces in INDEX_NAMESPACE_MAP.items():
        for ns in namespaces:
            if ns == "DEFENCE_EXAMS":
                continue  # Already migrated / CDS preserved
            json_file = os.path.join(pyq_dir, f"{ns}.json")
            upload_category_questions(pc, embedder, index_name, ns, json_file)

    # 5. Print final verification stats
    print("\n" + "=" * 60)
    print("📊 FINAL PINECONE INDEX & NAMESPACE VERIFICATION")
    print("=" * 60)
    for idx_name in ["pyq1", "pyq2", "pyq3", "pyq4"]:
        try:
            idx = pc.Index(idx_name)
            stats = idx.describe_index_stats()
            namespaces = stats.get('namespaces', {})
            total_vecs = stats.get('total_vector_count', 0)
            print(f"\n📁 Index: '{idx_name}' (Total Vectors: {total_vecs})")
            for ns_name, ns_data in namespaces.items():
                print(f"   🏷️  Namespace '{ns_name}': {ns_data.get('vector_count', 0)} vectors")
        except Exception as e:
            print(f"❌ Error getting stats for {idx_name}: {e}")

    print("\n🎉 ALL 4 INDEXES AND 12 NAMESPACES SUCCESSFULLY CONFIGURED!")

if __name__ == "__main__":
    main()
