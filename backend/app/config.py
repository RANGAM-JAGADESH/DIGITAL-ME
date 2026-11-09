from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    database_url: str
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    embed_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    owner_name: str = "Jashu"
    answer_max_words: int = 500
    match_threshold: float = 0.80  # similarity needed to reuse a saved answer
    router_min_score: float = 0.40  # below this, skip the LLM check and answer live

    # protection for the public site
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"  # comma-separated site URLs
    chat_rate_limit: str = "12/minute;200/day"  # per visitor (IP address)
    daily_llm_limit: int = 800  # AI answers per rolling 24 hours, across all visitors

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env")


settings = Settings()