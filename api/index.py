import os
import sys

# Ensure backend directory is in python search path for serverless invocation
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app  # ASGI app for Vercel Serverless
