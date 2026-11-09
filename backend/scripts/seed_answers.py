"""Pre-generate short answers for every FAQ question and store them for instant matching.

Usage (from the backend folder, venv active):
    python -m scripts.seed_answers              # all FAQ questions
    python -m scripts.seed_answers --only-new   # skip ones already saved
    python -m scripts.seed_answers --limit 5    # quick test run
"""
import argparse
import time
from pathlib import Path

from app.db import get_conn
from app.llm import generate
from app.paraphrase import paraphrases
from app.rag import embed, faq_items, retrieve

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
# FAQ numbers shown as suggested-question buttons on the website
SUGGESTED = {1, 2, 4, 6, 15, 23, 34, 35}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--only-new", action="store_true")
    parser.add_argument("--only", default="", help="comma-separated FAQ numbers, e.g. 13,14,25")
    args = parser.parse_args()

    items = faq_items((DATA_DIR / "faq.txt").read_text(encoding="utf-8"))
    if args.limit:
        items = items[: args.limit]
    if args.only:
        wanted = {int(x) for x in args.only.split(",") if x.strip()}
        items = [i for i in items if i[0] in wanted]

    with get_conn() as conn:
        existing = {
            r[0]
            for r in conn.execute(
                "select faq_number from answers where faq_number is not null"
            ).fetchall()
        }
        saved = 0
        for num, question, _ in items:
            if args.only_new and num in existing:
                continue

            result = None
            for attempt in range(3):
                try:
                    result = generate(question, retrieve(question))
                    break
                except Exception as exc:  # rate limits on the free tier
                    wait = 6 * (attempt + 1)
                    print(f"  retry Q{num} in {wait}s ({type(exc).__name__})")
                    time.sleep(wait)
            if not result or not result["answer"]:
                print(f"Q{num}: skipped (no answer)")
                continue

            vec = embed([question])[0]
            row = conn.execute(
                """
                insert into answers
                  (faq_number, question, answer_text, emotion, embedding, is_suggested)
                values (%s, %s, %s, %s, %s, %s)
                on conflict (faq_number) do update set
                  question = excluded.question,
                  answer_text = excluded.answer_text,
                  emotion = excluded.emotion,
                  embedding = excluded.embedding,
                  is_suggested = excluded.is_suggested,
                  audio_url = null,
                  video_url = null
                returning id
                """,
                (num, question, result["answer"], result["emotion"], vec, num in SUGGESTED),
            ).fetchone()
            answer_id = row[0]

            # alternative phrasings, so visitors' wording still matches this saved answer
            variants: list[str] = []
            for attempt in range(3):
                try:
                    variants = paraphrases(question)
                    break
                except Exception as exc:
                    wait = 6 * (attempt + 1)
                    print(f"  retry paraphrases Q{num} in {wait}s ({type(exc).__name__})")
                    time.sleep(wait)
            texts = [question] + variants
            conn.execute("delete from answer_variants where answer_id = %s", (answer_id,))
            for text, v in zip(texts, embed(texts)):
                conn.execute(
                    "insert into answer_variants (answer_id, question, embedding) values (%s, %s, %s)",
                    (answer_id, text, v),
                )
            saved += 1
            print(f"Q{num}: {question}\n   [{result['emotion']}] {result['answer']}")
            print(f"   + {len(variants)} paraphrases: {variants}\n")
            time.sleep(2.5)  # stay under free-tier rate limits
        print(f"done, {saved} answers saved")


if __name__ == "__main__":
    main()
