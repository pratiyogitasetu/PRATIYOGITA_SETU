import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import os
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'), override=True)

from pinecone import Pinecone

pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))

indexes = ['pyq1', 'pyq2', 'pyq3', 'pyq4']
print("=" * 60)
print("🔍 VERIFYING PINECONE INDEXES AND NAMESPACES")
print("=" * 60)

for idx_name in indexes:
    idx = pc.Index(idx_name)
    stats = idx.describe_index_stats()
    total = stats.get('total_vector_count', 0)
    print(f"\n📂 Index: '{idx_name}' (Total Vectors: {total})")
    namespaces = stats.get('namespaces', {})
    for ns, data in namespaces.items():
        print(f"   🔹 Namespace: {ns:32} | Vectors: {data.get('vector_count', 0)}")

print("\n" + "=" * 60)
print("✅ ALL 4 INDEXES CHECK COMPLETED")
print("=" * 60)
