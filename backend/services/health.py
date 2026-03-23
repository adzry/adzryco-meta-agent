"""
AdzryCo Meta-Agent — Health and readiness service
"""
from __future__ import annotations

from typing import Any

from config import Settings
from database import ping_supabase


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
    }

    overall = "ok"
    if env_errors or supabase_status["status"] in {"missing", "error"}:
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
    - Redis optional
    - X optional for read-only mode
    """
    health = await build_health_status(settings)

    required_ok = (
        settings.has_anthropic
        and settings.has_supabase
        and health["checks"]["supabase"]["status"] == "ok"
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
            },
            "warnings": health["warnings"],
        },
        required_ok,
    )


async def build_config_status(settings: Settings) -> dict[str, Any]:
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
        "cors_origins": settings.get_cors_origins(),
        "warnings": settings.warnings(),
        "validation_errors": settings.validation_errors(),
    }
