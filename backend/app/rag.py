from app.chunking import chunk_document, chunk_fixed, faq_items  # noqa: F401  (re-exported)
from app.db import get_conn
from app.embedder import embed  # noqa: F401  (re-exported)

# kept for backward compatibility with older scripts
chunk_text = chunk_fixed


def retrieve(question: str, k: int = 5, vec=None) -> list[dict]:
    if vec is None:
        vec = embed([question])[0]
    with get_conn() as conn:
        rows = conn.execute(
            """
            select source, content, 1 - (embedding <=> %s) as score
            from documents
            order by embedding <=> %s
            limit %s
            """,
            (vec, vec, k),
        ).fetchall()
    return [{"source": r[0], "content": r[1], "score": float(r[2])} for r in rows]
