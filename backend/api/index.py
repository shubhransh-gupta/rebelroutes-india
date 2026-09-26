"""
Vercel Python Serverless entry point.
Wraps the FastAPI app with Mangum for ASGI compatibility.
"""
import sys
import os

# Vercel runs functions from /var/task/<function_dir>.
# We need the *backend* root (one level up from api/) on sys.path
# so that `from app.main import app` resolves correctly.
_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND_ROOT = os.path.dirname(_HERE)   # backend/
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.main import app  # noqa: E402  (after sys.path setup)
from mangum import Mangum  # noqa: E402

# Vercel invokes this `handler` symbol
handler = Mangum(app, lifespan="off")
