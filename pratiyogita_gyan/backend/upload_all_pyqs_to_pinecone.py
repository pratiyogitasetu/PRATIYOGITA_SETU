import os
import sys
import json
import time
import math
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'), override=True)

from pinecone import Pinecone
sys.path.append(os.path.join(backend_dir, 'DATA'))
from train_pyq import NvidiaTrainEmbedder

INDEX_NAMESPACE_MAP = {
    "pyq1": ["DEFENCE_EXAMS", "CIVIL_SERVICES_EXAMS", "POLICE_EXAMS"],
    "pyq2": ["SSC_EXAMS", "RAILWAY_EXAMS", "BANKING_EXAMS"],
    "pyq3": ["MBA_EXAMS", "CUET_AND_UG_ENTRANCE_EXAMS", "PG_EXAMS"],
    "pyq4": ["ENGINEERING_RECRUITING_EXAMS", "TEACHING_EXAMS", "JUDICIARY_EXAMS"]
}

def preprocess_question(q):
    txt = q.get('question', '')
    stmts = q.get('statements', [])
    if stmts:
        txt += " " + " ".join(stmts)
    match_data = q.get('match_data')
    if match_data:
        l1 = " ".join(match_data.get('list_1', []))
        l2 = " ".join(match_data.get('list_2', []))
        txt += f" List-I: {l1} List-II: {l2}"
    
    opts = q.get('options', {})
    opt_str = " ".join([f"({k}) {v}" for k, v in opts.items() if v])
    meta_str = f"Exam: {q.get('exam_name', '')}, Year: {q.get('exam_year', '')}, Term: {q.get('exam_term', '')}, Subject: {q.get('subject', '')}"
    return f"Q: {txt} Options: {opt_str} {meta_str}"

def flatten_pyq_json(raw_data):
    questions = []
    if isinstance(raw_data, dict):
        for cat_k, exams in raw_data.items():
            if isinstance(exams, dict):
                for ex_name, years in exams.items():
                    if isinstance(years, dict):
                        for yr_key, q_list in years.items():
                            if isinstance(q_list, list):
                                for q in q_list:
                                    if isinstance(q, dict) and 'question' in q:
                                        questions.append(q)
    elif isinstance(raw_data, list):
        for q in raw_data:
            if isinstance(q, dict) and 'question' in q:
                questions.append(q)
    return questions

def upload_namespace(pc, embedder, index_name, namespace, pyq_dir):
    json_path = os.path.join(pyq_dir, f"{namespace}.json")
    if not os.path.exists(json_path):
        print(f"⚠️ JSON file not found: {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = flatten_pyq_json(data)
    total_q = len(questions)
    print(f"\n==================================================")
    print(f"📦 Index: '{index_name}' | Namespace: '{namespace}' | Questions: {total_q}")
    print(f"==================================================")

    if total_q == 0:
        return

    index = pc.Index(index_name)

    # Clean old namespace vectors so only the new clean vectors exist
    try:
        index.delete(delete_all=True, namespace=namespace)
        print(f"🧹 Cleaned existing vectors in '{namespace}'")
        time.sleep(1)
    except Exception as e:
        print(f"ℹ️ Delete notice for '{namespace}': {e}")

    batch_size = 96
    total_batches = math.ceil(total_q / batch_size)
    uploaded = 0
    t0 = time.time()

    for b in range(total_batches):
        b_start = b * batch_size
        b_end = min(b_start + batch_size, total_q)
        batch_qs = questions[b_start:b_end]

        texts = [preprocess_question(q) for q in batch_qs]

        for attempt in range(3):
            try:
                embeddings = embedder.encode_batch(texts, input_type="passage")
                break
            except Exception as e:
                if attempt == 2:
                    raise
                print(f"   ⚠️ Retry {attempt+1} batch {b+1}: {e}")
                time.sleep(2)

        batch_vectors = []
        for i, q in enumerate(batch_qs):
            # Deterministic sequential ID preserving original paper ordering
            vec_id = f"{namespace}_{b_start + i}"
            metadata = {
                'id': q.get('id', ''),
                'full_json_str': json.dumps(q, ensure_ascii=False),
                'text': texts[i],
                'question': q.get('question', ''),
                'directive': q.get('directive', ''),
                'question_type': q.get('question_type', 'single_choice'),
                'is_negative': q.get('is_negative', False),
                'options': json.dumps(q.get('options', {}), ensure_ascii=False),
                'correct_option': q.get('correct_option', ''),
                'correct_answer': q.get('correct_answer', ''),
                'exam_name': q.get('exam_name', ''),
                'exam_year': str(q.get('exam_year', '')),
                'exam_term': str(q.get('exam_term', '')),
                'subject': q.get('subject', ''),
                'topic': q.get('topic', ''),
                'explanation': q.get('explanation', ''),
                'img': q.get('image_url', ''),
                'image_url': q.get('image_url', ''),
                'sector': q.get('sector', ''),
                'source_url': q.get('source_url', ''),
                'namespace': namespace
            }
            batch_vectors.append({
                'id': vec_id,
                'values': embeddings[i],
                'metadata': metadata
            })

        index.upsert(vectors=batch_vectors, namespace=namespace)
        uploaded += len(batch_vectors)

        if (b + 1) % 5 == 0 or (b + 1) == total_batches:
            elapsed = time.time() - t0
            rate = uploaded / elapsed if elapsed > 0 else 0
            print(f"   🚀 [{namespace}] Batch {b+1}/{total_batches} ({uploaded}/{total_q} Qs) | Rate: {rate:.1f} Q/s")

    print(f"✅ Successfully uploaded {uploaded} questions to '{index_name}' [{namespace}] in {time.time()-t0:.1f}s")

def main():
    pine_key = os.getenv('PINECONE_API_KEY')
    nv_key = os.getenv('NVIDIA_API_KEY')
    if not pine_key or not nv_key:
        raise ValueError("PINECONE_API_KEY and NVIDIA_API_KEY are required in .env")

    pc = Pinecone(api_key=pine_key)
    embedder = NvidiaTrainEmbedder(nv_key, model="nvidia/nemotron-3-embed-1b", target_dim=768)
    pyq_dir = os.path.join(backend_dir, 'DATA', 'pyq')

    print("🚀 Starting Fast Pinecone Upload (Batch 96)...")
    overall_start = time.time()

    for index_name, namespaces in INDEX_NAMESPACE_MAP.items():
        for ns in namespaces:
            upload_namespace(pc, embedder, index_name, ns, pyq_dir)

    print("\n" + "=" * 60)
    print(f"🎉 ALL 12 NAMESPACES UPLOADED TO PINECONE SUCCESSFULLY in {time.time()-overall_start:.1f}s!")
    print("=" * 60)

if __name__ == '__main__':
    main()
