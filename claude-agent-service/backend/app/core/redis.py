"""
Redis configuration and connection management
"""
import redis.asyncio as redis
from typing import Optional
from .config import settings

# Global Redis client
redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """
    Get Redis client
    """
    global redis_client
    if redis_client is None:
        raise RuntimeError("Redis client not initialized")
    return redis_client


async def init_redis():
    """Initialize Redis connection"""
    global redis_client

    redis_client = redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        max_connections=10
    )

    # Test connection
    await redis_client.ping()
    print(f"Redis connected: {settings.REDIS_HOST}:{settings.REDIS_PORT}")


async def close_redis():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        print("Redis connection closed")
