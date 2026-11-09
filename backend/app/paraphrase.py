"""Generate alternative phrasings of a question so saved answers match paraphrases."""
import json
import re

from groq import Groq

from app.config import settings

_client = Groq(api_key=settings.groq_api_key)


def _parse(raw: str) -> list[str]:
    data = None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(0))
            except json.JSONDecodeError:
                data = None
    items = data.get("questions", []) if isinstance(data, dict) else []
    return [str(q).strip() for q in items if str(q).strip()]


def paraphrases(question: str, n: int = 6) -> list[str]:
    """Ways a recruiter or visitor might ask the same thing, including short casual ones."""
    messages = [
        {
            "role": "system",
            "content": (
                f"Write {n} different ways a recruiter, interviewer or visitor might ask the "
                "following question to a person. Mix formal, casual and very short versions. "
                "Keep the same meaning and do not add new topics. "
                'Return JSON only: {"questions": ["...", "..."]}'
            ),
        },
        {"role": "user", "content": question},
    ]
    try:
        resp = _client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.7,
        )
    except Exception:
        resp = _client.chat.completions.create(
            model=settings.groq_model, messages=messages, temperature=0.7
        )
    seen, out = {question.lower()}, []
    for q in _parse(resp.choices[0].message.content or ""):
        if q.lower() not in seen:
            seen.add(q.lower())
            out.append(q)
    return out[:n]
