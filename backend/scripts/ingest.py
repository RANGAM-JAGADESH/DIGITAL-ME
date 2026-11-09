from pathlib import Path

from app.db import get_conn
from app.rag import chunk_document, embed

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
# style.txt is used by the prompt, not retrieved
FILES = ["resume.txt", "faq.txt", "profile_extra.txt"]


def main():
    with get_conn() as conn:
        conn.execute("delete from documents")
        total = 0
        for name in FILES:
            path = DATA_DIR / name
            if not path.exists():
                print(f"skip {name} (not found)")
                continue
            chunks = chunk_document(name, path.read_text(encoding="utf-8"))
            vectors = embed(chunks)
            for i, (chunk, vec) in enumerate(zip(chunks, vectors)):
                conn.execute(
                    "insert into documents (source, chunk_index, content, embedding) "
                    "values (%s, %s, %s, %s)",
                    (name, i, chunk, vec),
                )
            total += len(chunks)
            print(f"{name}: {len(chunks)} chunks")
        print(f"done, {total} chunks stored")


if __name__ == "__main__":
    main()
