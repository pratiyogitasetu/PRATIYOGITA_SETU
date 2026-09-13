import os
import sys
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv('i:/chatbot/pratiyogita_gyan/backend/.env')
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))

indexes = pc.list_indexes()
print(f"Total Indexes found: {len(indexes)}")
for idx in indexes:
    print(f"\nIndex: {idx.name}")
    try:
        index = pc.Index(idx.name)
        stats = index.describe_index_stats()
        print(f"  Total vector count: {stats.total_vector_count}")
        for ns, ns_stats in stats.namespaces.items():
            print(f"    Namespace '{ns}': {ns_stats.vector_count} vectors")
    except Exception as e:
        print(f"  Error: {e}")
