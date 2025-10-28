"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    APP_NAME: str = "Claude Agent Service"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Claude API Configuration
    ANTHROPIC_BEDROCK_BASE_URL: str
    CLAUDE_CODE_SKIP_BEDROCK_AUTH: str = "1"
    CLAUDE_CODE_USE_BEDROCK: str = "1"
    ANTHROPIC_AUTH_TOKEN: str
    ANTHROPIC_SMALL_FAST_MODEL: str = "global.anthropic.claude-haiku-4-5-20251001-v1:0"
    ANTHROPIC_MODEL: str = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"

    # PostgreSQL Configuration
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "claude_agent"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "claude_agent_db"

    @property
    def DATABASE_URL(self) -> str:
        """Get database URL"""
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_CACHE_TTL: int = 3600  # 1 hour

    @property
    def REDIS_URL(self) -> str:
        """Get Redis URL"""
        # Only use password if it's not None and not empty string
        if self.REDIS_PASSWORD and self.REDIS_PASSWORD.strip():
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Workspace Settings
    WORKSPACE_ROOT: str = "/workspace"
    MAX_SESSIONS: int = 100
    SESSION_TIMEOUT: int = 3600  # 1 hour

    # CORS Settings
    CORS_ORIGINS: list[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
