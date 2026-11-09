"""Text embeddings.

Uses fastembed (the same all-MiniLM-L6-v2 model run through ONNX, no PyTorch, small enough for a
free server). If fastembed is not installed it falls back to sentence-transformers, so an older
local setup keeps working. Force one with EMBED_BACKEND=fastembed or EMBED_BACKEND=st.
"""
import os
import threading

import numpy as np

from app.config import settings

_lock = threading.Lock()
_kind = None
_model = None


def _load():
    global _kind, _model
    if _model is not None:
        return
    with _lock:
        if _model is not None:
            return
        choice = os.getenv("EMBED_BACKEND", "").lower()
        if choice != "st":
            try:
                from fastembed import TextEmbedding

                _model = TextEmbedding(model_name=settings.embed_model)
                _kind = "fastembed"
                return
            except ImportError:
                if choice == "fastembed":
                    raise
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(settings.embed_model)
        _kind = "sentence-transformers"


def backend_name() -> str:
    _load()
    return _kind


def embed(texts: list[str]):
    """Return one normalized 384-number vector per text."""
    _load()
    if _kind == "sentence-transformers":
        return _model.encode(texts, normalize_embeddings=True)
    vectors = np.array(list(_model.embed(texts)), dtype=np.float32)
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    return vectors / np.where(norms == 0, 1, norms)
