"""
AdzryCo Meta-Agent — Centralized runtime config
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False,
    )

    # App
    app_name: str = "AdzryCo Meta-Agent"
    app_version: str = "2.1.0"
    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # AI
    anthropic_api_key: str | None = None

    # Supabase
    supabase_url: str | None = None
    supabase_service_key: str | None = None

    # X / Twitter
    x_api_key: str | None = None
    x_api_secret: str | None = None
    x_access_token: str | None = None
    x_access_token_secret: str | None = None
    x_bearer_token: str | None = None

    # Security
    secret_key: str = "change-me-in-production"

    # Redis (optional)
    redis_url: str | None = "redis://localhost:6379"

    @property
    def has_anthropic(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def has_supabase(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_key)

    @property
    def has_x_credentials(self) -> bool:
        return all(
            [
                self.x_api_key,
                self.x_api_secret,
                self.x_access_token,
                self.x_access_token_secret,
                self.x_bearer_token,
            ]
        )

    @property
    def has_redis(self) -> bool:
        return bool(self.redis_url)

    def get_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validation_errors(self) -> list[str]:
        errors: list[str] = []

        if not self.has_anthropic:
            errors.append("ANTHROPIC_API_KEY is missing")

        if not self.supabase_url:
            errors.append("SUPABASE_URL is missing")

        if not self.supabase_service_key:
            errors.append("SUPABASE_SERVICE_KEY is missing")

        return errors

    def warnings(self) -> list[str]:
        warnings: list[str] = []

        if not self.has_x_credentials:
            warnings.append("X/Twitter credentials missing; write actions should remain disabled")

        if not self.has_redis:
            warnings.append("Redis not configured; approval state is ephemeral")

        if self.secret_key == "change-me-in-production":
            warnings.append("SECRET_KEY is using the default insecure value")

        return warnings

    def redacted_dict(self) -> dict[str, Any]:
        return {
            "app_name": self.app_name,
            "app_version": self.app_version,
            "app_env": self.app_env,
            "api_host": self.api_host,
            "api_port": self.api_port,
            "cors_origins": self.get_cors_origins(),
            "anthropic_configured": self.has_anthropic,
            "supabase_configured": self.has_supabase,
            "x_configured": self.has_x_credentials,
            "redis_configured": self.has_redis,
            "secret_key_is_default": self.secret_key == "change-me-in-production",
        }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
