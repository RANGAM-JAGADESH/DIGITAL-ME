"""Check that the current embedding backend reproduces the vectors already stored in the database.

If the lowest similarity is about 0.99 or higher, the stored data stays valid and nothing needs
re-loading. Otherwise run ingest and seed_answers again.

Run from the backend folder (venv active):  python -m scripts.verify_embeddings
"""
import numpy as np

from app.db import get_conn
from app.embedder import backend_name, embed


def to_array(value):
    """Stored vectors come back as a pgvector Vector object in newer versions, or a numpy array in older ones."""
    if hasattr(value, "to_numpy"):
        return value.to_numpy().astype(np.float32)
    return np.asarray(value, dtype=np.float32)


def cosine(a, b) -> float:
    a = to_array(a)
    b = to_array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def main():
    with get_conn() as conn:
        docs = conn.execute(
            "select content, embedding from documents order by random() limit 10"
        ).fetchall()
        answers = conn.execute(
            "select question, embedding from answers where embedding is not null order by random() limit 10"
        ).fetchall()
    rows = docs + answers
    if not rows:
        print("Nothing stored yet. Run ingest first.")
        return

    fresh = embed([r[0] for r in rows])
    sims = [cosine(fresh[i], rows[i][1]) for i in range(len(rows))]

    print(f"embedding backend: {backend_name()}")
    print(f"checked {len(rows)} stored vectors")
    print(f"lowest similarity: {min(sims):.4f}   average: {sum(sims) / len(sims):.4f}")
    if min(sims) >= 0.99:
        print("OK: the stored data matches. No re-ingest needed.")
    else:
        print("MISMATCH: run run_ingest.bat and then seed_answers.bat so the stored vectors match.")


if __name__ == "__main__":
    main()
