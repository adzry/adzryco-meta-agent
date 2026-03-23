"""
AdzryCo Meta-Agent — Health and readiness service
"""
from __future__ import annotations

from typing import Any

from config import Settings
from database import ping_supabase


def approval_store_status(settings: Settings) -> dict[str, Any]:
    backend = settings.normalized_approval_store_backend

    if backend == "redis":
        if settings.has_redis:
            return {
                "status": "configured",
                "backend": "redis",
                "durable": False,
                "detail": "Redis backend selected; runtime store scaffold not fully durable yet",
            }
        return {
            "status": "misconfigured",
            "backend": "redis",
            "durable": False,
            "detail": "APPROVAL_STORE_BACKEND=redis but REDIS_URL is missing",
        }

    return {
        "status": "configured",
        "backend": "memory",
        "durable": False,
        "detail": "In-memory approval store active; pending approvals are ephemeral",
    }


async def check_supabase_status(settings: Settings) -> dict[str, Any]:
    if not settings.has_supabase:
        return {
            "status": "missing",
            "detail": "SUPABASE_URL and/or SUPABASE_SERVICE_KEY missing",
        }

    ok = await ping_supabase()
    return {
        "status": "ok" if ok else "error",
        "detail": "Supabase reachable" if ok else "Supabase ping failed",
    }


def check_redis_status(settings: Settings) -> dict[str, Any]:
    if not settings.has_redis:
        return {
            "status": "unconfigured",
            "detail": "Redis not configured",
        }

    return {
        "status": "configured",
        "detail": "Redis URL present (connectivity not probed in v1)",
    }


async def build_health_status(settings: Settings) -> dict[str, Any]:
    env_errors = settings.validation_errors()
    supabase_status = await check_supabase_status(settings)
    redis_status = check_redis_status(settings)
    approval_status = approval_store_status(settings)

    checks = {
        "env": {
            "status": "ok" if not env_errors else "degraded",
            "missing": env_errors,
        },
        "anthropic": {
            "status": "ok" if settings.has_anthropic else "missing",
        },
        "x": {
            "status": "ok" if settings.has_x_credentials else "missing",
        },
        "supabase": supabase_status,
        "redis": redis_status,
        "approval_store": approval_status,
    }

    overall = "ok"
    if env_errors or supabase_status["status"] in {"missing", "error"} or approval_status["status"] == "misconfigured":
        overall = "degraded"

    return {
        "status": overall,
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
        "checks": checks,
        "warnings": settings.warnings(),
    }


async def build_ready_status(settings: Settings) -> tuple[dict[str, Any], bool]:
    """
    Strict readiness for deployment:
    - Anthropic required
    - Supabase required and must be reachable
    - Approval store config cannot be internally misconfigured
    - X optional for read-only mode
    """
    health = await build_health_status(settings)

    required_ok = (
        settings.has_anthropic
        and settings.has_supabase
        and health["checks"]["supabase"]["status"] == "ok"
        and health["checks"]["approval_store"]["status"] != "misconfigured"
    )

    return (
        {
            "ready": required_ok,
            "service": settings.app_name,
            "version": settings.app_version,
            "required": {
                "anthropic": settings.has_anthropic,
                "supabase": settings.has_supabase,
                "supabase_reachable": health["checks"]["supabase"]["status"] == "ok",
                "approval_store_valid": health["checks"]["approval_store"]["status"] != "misconfigured",
            },
            "warnings": health["warnings"],
        },
        required_ok,
    )


async def build_config_status(settings: Settings) -> dict[str, Any]:
    approval_status = approval_store_status(settings)
    return {
        "app": {
            "name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.app_env,
        },
        "services": {
            "anthropic": settings.has_anthropic,
            "supabase": settings.has_supabase,
            "x_api": settings.has_x_credentials,
            "redis": settings.has_redis,
        },
        "approval_store": {
            "backend": approval_status["backend"],
            "durable": approval_status["durable"],
            "status": approval_status["status"],
            "detail": approval_status["detail"],
        },
        "cors_origins": settings.get_cors_origins(),
        "warnings": settings.warnings(),
        "validation_errors": settings.validation_errors(),
    }
