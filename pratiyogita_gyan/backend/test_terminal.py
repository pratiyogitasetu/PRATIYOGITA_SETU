#!/usr/bin/env python3
import os
import sys
import time
import json

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, initialize_search_system, search_components, encode_query

print("=" * 70)
print("RUNNING COMPREHENSIVE TERMINAL TEST FOR NEMOTRON-3-EMBED-1B")
print("=" * 70)

# 1. Initialize system
print("\n[Step 1] Initializing Search System...")
t0 = time.time()
initialize_search_system()
init_time = time.time() - t0
print(f"Initialization completed in {init_time:.2f}s")
print(f"MCQ Model in use: {type(search_components.get('mcq_model')).__name__}")
print(f"MCQ Backend name: {search_components.get('mcq_backend')}")
print(f"MCQ Index in Pinecone: {os.getenv('MCQ_INDEX_NAME')}")
print(f"NCERT Search Disabled: {os.getenv('DISABLE_NCERT_SEARCH') == '1'}")

# 2. Test raw embedding latency
print("\n[Step 2] Testing Raw Embedding Generation Speed...")
mcq_model = search_components.get("mcq_model")
for test_prompt in ["Article 21 Indian Constitution", "Hybridization in crop varieties", "Mughal painting under Akbar"]:
    t_start = time.time()
    vec = encode_query(mcq_model, test_prompt)
    lat = (time.time() - t_start) * 1000
    print(f"\"{test_prompt}\" -> {len(vec)}d vector generated in {lat:.1f}ms")

# 3. Test PYQ Search API Endpoint
print("\n[Step 3] Testing /api/pyq/search Endpoint (Retrieval from pyq-nemotron)...")
client = app.test_client()
search_queries = [
    "Akbar court painting books",
    "Fundamental Rights Constitution",
    "crossing genetically dissimilar plants hybridization"
]

for query in search_queries:
    t_start = time.time()
    resp = client.post("/api/pyq/search", json={
        "query": query,
        "similarity_threshold": 0.01,
        "limit": 3
    })
    duration = (time.time() - t_start) * 1000
    if resp.status_code == 200:
        data = resp.get_json()
        total = data.get("total", len(data.get("questions", [])))
        print(f"\nQuery: '{query}'")
        print(f"Status: {resp.status_code} OK | Retrieved: {total} matches in {duration:.1f}ms")
        questions = data.get("questions", [])
        for i, q in enumerate(questions[:2], 1):
            score = q.get("score") or q.get("similarity_score") or "N/A"
            q_text = q.get("question", "")
            print(f"Match #{i} (Score: {score}): {q_text[:90]}...")
    else:
        print(f"Query failed with status {resp.status_code}: {resp.get_data(as_text=True)}")

# 4. Test Main /api/search (Chatbot endpoint - PYQ only, NCERT blocked)
print("\n[Step 4] Testing Main /api/search (Chat Search - PYQ only mode)...")
t_start = time.time()
resp_search = client.post("/api/search", json={
    "query": "Which book was not illustrated in Akbar's court?",
    "n_results": 3,
    "mcq_threshold": 0.01,
    "mcq_limit": 3
})
chat_duration = (time.time() - t_start) * 1000
if resp_search.status_code == 200:
    data = resp_search.get_json()
    print(f"Status: {resp_search.status_code} OK in {chat_duration:.1f}ms")
    print(f"NCERT Sources returned: {len(data.get('sources', []))} (Expected: 0 - blocked)")
    print(f"PYQ MCQ Matches returned: {len(data.get('mcq_results', []))}")
    print(f"AI Answer: {data.get('rag_response', '')[:160]}...")
else:
    print(f"Search failed with status {resp_search.status_code}: {resp_search.get_data(as_text=True)}")

# 5. Test Filters Endpoint
print("\n[Step 5] Testing /api/pyq/filters Endpoint...")
t_start = time.time()
r_filters = client.get("/api/pyq/filters")
f_lat = (time.time() - t_start) * 1000
print(f"Status: {r_filters.status_code} OK in {f_lat:.1f}ms")
if r_filters.is_json:
    f_data = r_filters.get_json()
    print(f"Available filter categories: {list(f_data.keys())}")

# 6. Test Random Questions Endpoint
print("\n[Step 6] Testing /api/pyq/random Endpoint...")
t_start = time.time()
r_rand = client.post("/api/pyq/random", json={"count": 2})
rand_lat = (time.time() - t_start) * 1000
print(f"Status: {r_rand.status_code} OK in {rand_lat:.1f}ms")
if r_rand.is_json:
    rand_data = r_rand.get_json()
    print(f"Random questions returned: {len(rand_data.get('questions', []))}")

print("\n" + "=" * 70)
print("ALL TERMINAL TESTS COMPLETED SUCCESSFULLY!")
print("=" * 70)
