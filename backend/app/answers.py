"""Saved (pre-generated) answers, suggested questions and the question log."""
from app.db import get_conn


def match_candidates(vec, k: int = 3) -> list[dict]:
    """Top-k distinct saved answers, each scored by its best-matching question or paraphrase."""
    with get_conn() as conn:
        rows = conn.execute(
            """
            select a.id, a.question, a.answer_text, a.emotion, a.audio_url, a.video_url,
                   max(1 - (m.emb <=> %s)) as score
            from (
              select id as answer_id, embedding as emb from answers where embedding is not null
              union all
              select answer_id, embedding as emb from answer_variants where embedding is not null
            ) m
            join answers a on a.id = m.answer_id
            group by a.id
            order by score desc
            limit %s
            """,
            (vec, k),
        ).fetchall()
    return [
        {
            "id": r[0],
            "question": r[1],
            "answer": r[2],
            "emotion": r[3] or "neutral",
            "audio_url": r[4],
            "video_url": r[5],
            "score": float(r[6]),
        }
        for r in rows
    ]


def match_saved_answer(vec) -> dict | None:
    """Return the closest saved answer to a question vector, with its similarity score.

    Compares against each saved question and all of its stored paraphrases.
    """
    with get_conn() as conn:
        row = conn.execute(
            """
            select a.id, a.question, a.answer_text, a.emotion, a.audio_url, a.video_url,
                   1 - (m.emb <=> %s) as score
            from (
              select id as answer_id, embedding as emb from answers where embedding is not null
              union all
              select answer_id, embedding as emb from answer_variants where embedding is not null
            ) m
            join answers a on a.id = m.answer_id
            order by m.emb <=> %s
            limit 1
            """,
            (vec, vec),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "question": row[1],
        "answer": row[2],
        "emotion": row[3] or "neutral",
        "audio_url": row[4],
        "video_url": row[5],
        "score": float(row[6]),
    }


def llm_calls_last_day() -> int:
    """How many AI answers were generated in the last 24 hours (used for the daily cap)."""
    try:
        with get_conn() as conn:
            row = conn.execute(
                "select count(*) from question_log "
                "where created_at > now() - interval '24 hours' and source in ('live', 'router')"
            ).fetchone()
        return int(row[0])
    except Exception:
        return 0  # if the count fails, do not block visitors


def list_suggestions(limit: int = 8) -> list[str]:
    with get_conn() as conn:
        rows = conn.execute(
            "select question from answers where is_suggested order by faq_number nulls last, id limit %s",
            (limit,),
        ).fetchall()
    return [r[0] for r in rows]


def log_question(question: str, source: str, score: float | None) -> None:
    """Best-effort log of what visitors ask; used later to grow the saved answers."""
    try:
        with get_conn() as conn:
            conn.execute(
                "insert into question_log (question, source, score) values (%s, %s, %s)",
                (question[:500], source, score),
            )
    except Exception:
        pass
