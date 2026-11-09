from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.answers import list_suggestions
from app.config import settings
from app.db import get_conn
from app.embedder import embed
from app.service import ServiceBusy, answer

# Behind Render's proxy the real visitor address comes from uvicorn's --proxy-headers option
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # load the embedding model and open a database connection before the first visitor arrives
    try:
        embed(["warm up"])
        with get_conn() as conn:
            conn.execute("select 1")
    except Exception as exc:  # the API can still start; the first request will retry
        print(f"startup warm-up skipped: {exc}")
    yield


app = FastAPI(title="Digital Me API", lifespan=lifespan)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def too_many_requests(_request: Request, _exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "You're asking quickly. Please wait a moment and try again."},
    )


origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/suggestions")
@limiter.limit("60/minute")
def suggestions(request: Request):
    return {"questions": list_suggestions()}


@app.post("/api/chat")
@limiter.limit(settings.chat_rate_limit)
def chat(request: Request, req: ChatRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question is empty")
    try:
        return answer(question)
    except ServiceBusy as exc:
        raise HTTPException(status_code=503, detail=str(exc))
