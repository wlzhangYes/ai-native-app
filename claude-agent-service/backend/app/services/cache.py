"""
Redis cache service
"""
import json
from typing import Optional, Any
from redis.asyncio import Redis

from app.core.redis import get_redis
from app.core.config import settings


class CacheService:
    """Redis cache service"""

    def __init__(self):
        self.redis: Optional[Redis] = None
        self.ttl = settings.REDIS_CACHE_TTL

    async def initialize(self):
        """Initialize Redis connection"""
        self.redis = await get_redis()

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis:
            return None

        value = await self.redis.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        if not self.redis:
            return False

        expire_time = ttl or self.ttl

        if isinstance(value, (dict, list)):
            value = json.dumps(value)

        await self.redis.set(key, value, ex=expire_time)
        return True

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.redis:
            return False

        result = await self.redis.delete(key)
        return bool(result)

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.redis:
            return False

        return bool(await self.redis.exists(key))

    async def incr(self, key: str, amount: int = 1) -> int:
        """Increment counter"""
        if not self.redis:
            return 0

        return await self.redis.incrby(key, amount)

    async def get_session_info(self, session_id: str) -> Optional[dict]:
        """Get session info from cache"""
        return await self.get(f"session:{session_id}")

    async def set_session_info(self, session_id: str, info: dict, ttl: Optional[int] = None) -> bool:
        """Set session info in cache"""
        return await self.set(f"session:{session_id}", info, ttl)

    async def delete_session_info(self, session_id: str) -> bool:
        """Delete session info from cache"""
        return await self.delete(f"session:{session_id}")

    async def list_session_keys(self) -> list[str]:
        """List all session keys"""
        if not self.redis:
            return []

        keys = await self.redis.keys("session:*")
        return [key.replace("session:", "") for key in keys]


# Global cache service instance
cache_service = CacheService()
