import sys
import os

# Add backend directory to path so app.py modules are found
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ensure app.py uses backend/.env if available in local development
from app import app, initialize_search_system, system_initialized

# Ensure search system is initialized on startup for serverless cold start
if not system_initialized:
    try:
        initialize_search_system()
    except Exception as e:
        app.logger.warning(f"Initial serverless search system init warning: {e}")

# Vercel looks for the WSGI/ASGI 'app' object
