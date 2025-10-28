"""
Database configuration and session management
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from .config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    Dependency for getting database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database"""
    async with engine.begin() as conn:
        # Import all models here to ensure they are registered
        from app.models.session import Session  # noqa
        from app.models.conversation import Conversation  # noqa

        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections"""
    await engine.dispose()
