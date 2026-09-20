import os
import sys

# Ensure api directory is first in python search path
api_dir = os.path.abspath(os.path.dirname(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

from main import app  # ASGI app for Vercel Serverless
