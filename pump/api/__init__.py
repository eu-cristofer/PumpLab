"""FastAPI HTTP surface for the pump library.

This package wraps `pump` for use by the React frontend and (later) the
desktop shell. The current iteration exposes only `/api/analysis/fit-curve`
— enough to prove the end-to-end stack works.
"""

from .main import app

__all__ = ["app"]
