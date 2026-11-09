"""Core question-answering logic, shared by the API and the evaluation script."""
from app.answers import llm_calls_last_day, log_question, match_candidates
from app.config import settings
from app.llm import generate
from app.rag import embed, retrieve
from app.router import pick_saved

FALLBACK_MIN_SCORE = 0.60  # a roughly related saved answer beats an error when the LLM is unavailable

BUSY_MESSAGE = "The AI service is busy. Please try again in a minute."
LIMIT_MESSAGE = (
    "I've answered a lot of questions today and need a rest. "
    "Please try again tomorrow, or have a look at the About me tab."
)


class ServiceBusy(Exception):
    """The AI part can't answer right now (provider error or daily limit reached)."""


def _saved_response(saved: dict, matched_by: str) -> dict:
    return {
        "answer": saved["answer"],
        "emotion": saved["emotion"],
        "audio_url": saved["audio_url"],
        "video_url": saved["video_url"],
        "source": "saved",
        "matched_by": matched_by,
        "matched_question": saved["question"],
        "score": round(saved["score"], 3),
        "sources": [],
    }


def answer(question: str) -> dict:
    question = question.strip()
    vec = embed([question])[0]
    candidates = match_candidates(vec, k=3)
    best = candidates[0] if candidates else None

    # Layer 1a: a very close saved answer is returned instantly (and carries any saved audio/video)
    if best and best["score"] >= settings.match_threshold:
        log_question(question, "saved", best["score"])
        return _saved_response(best, "similarity")

    # Daily cap on AI calls, so the free provider limit can't be drained
    if llm_calls_last_day() >= settings.daily_llm_limit:
        if best and best["score"] >= FALLBACK_MIN_SCORE:
            log_question(question, "fallback", best["score"])
            return _saved_response(best, "fallback")
        raise ServiceBusy(LIMIT_MESSAGE)

    # Layer 1b: in-between score, so let the LLM judge whether a saved answer really fits
    if best and best["score"] >= settings.router_min_score:
        try:
            chosen = pick_saved(question, candidates)
        except Exception:
            chosen = None
        if chosen:
            log_question(question, "router", chosen["score"])
            return _saved_response(chosen, "llm")

    # Layer 2: live RAG + LLM
    try:
        contexts = retrieve(question, vec=vec)
        result = generate(question, contexts)
    except Exception:
        if best and best["score"] >= FALLBACK_MIN_SCORE:
            log_question(question, "fallback", best["score"])
            return _saved_response(best, "fallback")
        raise ServiceBusy(BUSY_MESSAGE)

    log_question(question, "live", best["score"] if best else None)
    return {
        **result,
        "audio_url": None,
        "video_url": None,
        "source": "live",
        "matched_by": None,
        "matched_question": None,
        "score": round(best["score"], 3) if best else None,
        "sources": [c["source"] for c in contexts],
    }
