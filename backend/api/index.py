"""
Vercel Python Serverless entry point.
Wraps the FastAPI app with Mangum for ASGI compatibility.
"""
import sys
import os

# Ensure the backend root is in path so 'app' package resolves correctly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from mangum import Mangum

# Vercel calls this `handler`
handler = Mangum(app, lifespan="off")
