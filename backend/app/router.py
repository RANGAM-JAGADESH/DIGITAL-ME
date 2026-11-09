"""LLM check for in-between similarity scores: does a saved question ask the same thing?"""
import json
import re

from groq import Groq

from app.config import settings

_client = Groq(api_key=settings.groq_api_key)


def _parse(raw: str) -> int:
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
    try:
        return int(data.get("match", 0)) if isinstance(data, dict) else 0
    except (TypeError, ValueError):
        return 0


def pick_saved(question: str, candidates: list[dict]) -> dict | None:
    """Return the candidate whose saved answer fully answers the question, or None."""
    listing = "\n".join(
        f"{i}. Saved question: {c['question']}\n   Saved answer: {c['answer'][:180]}"
        for i, c in enumerate(candidates, start=1)
    )
    messages = [
        {
            "role": "system",
            "content": (
                "A visitor asked a question. Below are saved question-and-answer pairs. "
                "Pick the number of the saved pair whose answer fully answers the visitor's "
                "question, meaning it asks for the same information. Be strict: a question about "
                "a different topic, project, person or technology is NOT a match, and neither is "
                "a question that needs information the saved answer does not contain. "
                'If none fits, use 0. Return JSON only: {"match": <number>}'
            ),
        },
        {"role": "user", "content": f"Visitor question: {question}\n\n{listing}"},
    ]
    try:
        resp = _client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0,
        )
    except Exception:
        resp = _client.chat.completions.create(
            model=settings.groq_model, messages=messages, temperature=0
        )
    choice = _parse(resp.choices[0].message.content or "")
    if 1 <= choice <= len(candidates):
        return candidates[choice - 1]
    return None
