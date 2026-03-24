"""
AdzryCo Meta-Agent — Approval store abstraction
"""
from __future__ import annotations

from typing import Any, Protocol

from loguru import logger

from config import Settings


class ApprovalStore(Protocol):
    def set(self, thread_id: str, payload: dict[str, Any]) -> None: ...
    def get(self, thread_id: str) -> dict[str, Any] | None: ...
    def delete(self, thread_id: str) -> None: ...
    def backend_name(self) -> str: ...
    def is_durable(self) -> bool: ...


class InMemoryApprovalStore:
    def __init__(self) -> None:
        self._store: dict[str, dict[str, Any]] = {}

    def set(self, thread_id: str, payload: dict[str, Any]) -> None:
        self._store[thread_id] = payload

    def get(self, thread_id: str) -> dict[str, Any] | None:
        return self._store.get(thread_id)

    def delete(self, thread_id: str) -> None:
        self._store.pop(thread_id, None)

    def backend_name(self) -> str:
        return "memory"

    def is_durable(self) -> bool:
        return False


class RedisApprovalStore:
    """Scaffold: reports backend_name='redis' but falls back to in-process storage.

    is_durable() intentionally returns False to signal this is not yet truly
    durable.  The SSE approval_required event surfaces this to the frontend.
    """

    def __init__(self, redis_url: str) -> None:
        self.redis_url = redis_url
        logger.warning(
            "RedisApprovalStore scaffold active; falling back to in-process semantics "
            "until Redis client is wired"
        )
        self._fallback = InMemoryApprovalStore()

    def set(self, thread_id: str, payload: dict[str, Any]) -> None:
        self._fallback.set(thread_id, payload)

    def get(self, thread_id: str) -> dict[str, Any] | None:
        return self._fallback.get(thread_id)

    def delete(self, thread_id: str) -> None:
        self._fallback.delete(thread_id)

    def backend_name(self) -> str:
        return "redis"

    def is_durable(self) -> bool:
        return False


def get_approval_store(settings: Settings) -> ApprovalStore:
    backend = settings.normalized_approval_store_backend

    if backend == "redis":
        if settings.has_redis:
            return RedisApprovalStore(settings.redis_url)  # type: ignore[arg-type]
        # REDIS_URL missing — misconfiguration already surfaced by config.validation_errors()
        # and /health. Fall back to memory and emit a visible startup warning.
        logger.warning(
            "APPROVAL_STORE_BACKEND=redis requested but REDIS_URL is not set. "
            "Falling back to InMemoryApprovalStore. "
            "Pending approvals will be ephemeral. Fix REDIS_URL to use durable storage."
        )

    return InMemoryApprovalStore()
