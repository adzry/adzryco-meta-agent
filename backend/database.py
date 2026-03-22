"""
AdzryCo Meta-Agent — Supabase Database Layer
"""
from supabase import create_client, Client
from pydantic_settings import BaseSettings
from loguru import logger
from typing import Optional
import uuid
from datetime import datetime


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    anthropic_api_key: str
    x_api_key: str
    x_api_secret: str
    x_access_token: str
    x_access_token_secret: str
    x_bearer_token: str
    secret_key: str = "change-me-in-production"
    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

_supabase: Optional[Client] = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_service_key)
        logger.info("Supabase client initialized")
    return _supabase


async def create_conversation(user_id: str, title: str = "New Conversation") -> dict:
    db = get_supabase()
    data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = db.table("conversations").insert(data).execute()
    return result.data[0] if result.data else data


async def get_conversations(user_id: str, limit: int = 50) -> list:
    db = get_supabase()
    result = (
        db.table("conversations")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []
