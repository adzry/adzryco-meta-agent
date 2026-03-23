"""
AdzryCo Meta-Agent — Supabase Database Layer
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
import uuid

from loguru import logger
from supabase import Client, create_client

from config import settings


_supabase: Optional[Client] = None


def get_supabase() -> Client:
    global _supabase

    if not settings.has_supabase:
        raise RuntimeError("Supabase is not configured")

    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_service_key)
        logger.info("Supabase client initialized")

    return _supabase


async def ping_supabase() -> bool:
    try:
        db = get_supabase()
        db.table("conversations").select("id").limit(1).execute()
        return True
    except Exception as exc:
        logger.warning(f"Supabase ping failed: {exc}")
        return False


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
