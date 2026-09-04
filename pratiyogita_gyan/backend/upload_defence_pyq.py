#!/usr/bin/env python3
"""
Upload DEFENCE_EXAMS.json into Pinecone index 'pyq' under namespace 'DEFENCE_EXAMS'
"""

import os
import sys
import json
import time
import math
from dotenv import load_dotenv

# Reconfigure stdout for utf-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'), override=True)

from pinecone import Pinecone, ServerlessSpec
from train_pyq import NvidiaTrainEmbedder, preprocess_mcq, flatten_nested_json

def main():
    pinecone_key = os.getenv('PINECONE_API_KEY')
    nvidia_key = os.getenv('NVIDIA_API_KEY')
    target_index_name = "pyq"
    target_namespace = "DEFENCE_EXAMS"
    json_path = os.path.join(backend_dir, 'DATA', 'pyq', 'DEFENCE_EXAMS.json')

    print(f"🚀 Starting PYQ Upload to Pinecone Index: '{target_index_name}' | Namespace: '{target_namespace}'")
    print(f"📁 Reading: {json_path}")

    with open(json_path, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)

    questions = flatten_nested_json(raw_data)
    total_q = len(questions)
    print(f"📊 Total extracted questions: {total_q}")

    if total_q == 0:
        print("❌ No questions found to upload!")
        return

    # Initialize Pinecone
    pc = Pinecone(api_key=pinecone_key)
    existing_indexes = [idx.name for idx in pc.list_indexes()]

    if target_index_name not in existing_indexes:
        print(f"📦 Creating Pinecone index '{target_index_name}'...")
        pc.create_index(
            name=target_index_name,
            dimension=768,
            metric='dotproduct',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
        while not pc.describe_index(target_index_name).status['ready']:
            time.sleep(1)
        print(f"✅ Index '{target_index_name}' created and ready.")
    else:
        print(f"✅ Index '{target_index_name}' already exists.")

    index = pc.Index(target_index_name)

    # Initialize Embedder
    embedder = NvidiaTrainEmbedder(nvidia_key, "nvidia/nemotron-3-embed-1b", target_dim=768)

    batch_size = 50
    total_batches = math.ceil(total_q / batch_size)
    uploaded_count = 0
    start_time = time.time()

    print(f"⚡ Uploading in {total_batches} batches of {batch_size}...")

    for b_idx in range(total_batches):
        batch_start = b_idx * batch_size
        batch_end = min(batch_start + batch_size, total_q)
        batch_questions = questions[batch_start:batch_end]

        # Prepare texts
        texts = [preprocess_mcq(q) for q in batch_questions]

        # Generate embeddings
        try:
            embeddings = embedder.encode_batch(texts, input_type="passage")
        except Exception as e:
            print(f"⚠️ Batch {b_idx + 1}/{total_batches} embed retry: {e}")
            time.sleep(3)
            embeddings = embedder.encode_batch(texts, input_type="passage")

        # Build vectors
        batch_vectors = []
        for i, q in enumerate(batch_questions):
            global_id = f"DEFENCE_EXAMS_{batch_start + i}"
            metadata = {
                'full_json_str': json.dumps(q, ensure_ascii=False),
                'text': texts[i],
                'question': q.get('question', ''),
                'options': json.dumps(q.get('options', {}), ensure_ascii=False),
                'correct_option': q.get('correct_option', ''),
                'exam_name': q.get('exam_name', ''),
                'exam_year': str(q.get('exam_year', '')),
                'exam_term': str(q.get('exam_term', '')),
                'subject': q.get('subject', ''),
                'correct_answer': q.get('correct_answer', ''),
                'explanation': q.get('explanation', ''),
                'topic': q.get('topic', ''),
                'keyword_and_metadata': json.dumps(q.get('keyword_and_metadata', []), ensure_ascii=False),
                'img': q.get('img', ''),
                'sector': q.get('sector', ''),
                'source_url': q.get('source_url', ''),
                'namespace': target_namespace
            }
            batch_vectors.append({
                'id': global_id,
                'values': embeddings[i],
                'metadata': metadata
            })

        # Upsert batch
        index.upsert(vectors=batch_vectors, namespace=target_namespace)
        uploaded_count += len(batch_vectors)

        if (b_idx + 1) % 5 == 0 or (b_idx + 1) == total_batches:
            elapsed = time.time() - start_time
            rate = uploaded_count / elapsed if elapsed > 0 else 0
            print(f"   📤 Progress: {b_idx + 1}/{total_batches} batches ({uploaded_count}/{total_q} questions) | Rate: {rate:.1f} q/s")

    elapsed_total = time.time() - start_time
    print(f"\n🎉 Successfully uploaded {uploaded_count} questions to '{target_index_name}' [{target_namespace}] in {elapsed_total:.1f}s!")

    # Verify index stats
    stats = index.describe_index_stats()
    print(f"📊 Current index stats for '{target_index_name}':")
    print(f"   Total vector count: {stats.total_vector_count}")
    print(f"   Namespaces: {stats.namespaces}")

if __name__ == '__main__':
    main()
