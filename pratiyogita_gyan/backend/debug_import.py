import sys
import traceback

print("Python version:", sys.version)
print("Executable:", sys.executable)

try:
    print("Attempting to import torch...")
    import torch
    print("torch version:", torch.__version__)
except Exception as e:
    print("❌ Failed to import torch:")
    traceback.print_exc()

try:
    print("\nAttempting to import sentence_transformers...")
    import sentence_transformers
    from sentence_transformers import SentenceTransformer
    print("✅ sentence_transformers imported successfully!")
except Exception as e:
    print("❌ Failed to import sentence_transformers:")
    traceback.print_exc()
