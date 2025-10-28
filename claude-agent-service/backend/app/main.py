"""
FastAPI main application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.redis import init_redis, close_redis
from app.services.cache import cache_service
from app.api import sessions, chat, files


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""

    # Startup
    print("=" * 60)
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print("=" * 60)

    # Initialize database
    print("\n[1/3] Initializing database...")
    await init_db()
    print(f"✓ Database initialized: {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}")

    # Initialize Redis
    print("\n[2/3] Initializing Redis...")
    await init_redis()
    await cache_service.initialize()
    print(f"✓ Redis initialized: {settings.REDIS_HOST}:{settings.REDIS_PORT}")

    # Workspace
    print(f"\n[3/3] Workspace root: {settings.WORKSPACE_ROOT}")
    print(f"✓ Max sessions: {settings.MAX_SESSIONS}")

    print("\n" + "=" * 60)
    print(f"🚀 {settings.APP_NAME} is ready!")
    print(f"📚 API Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print("=" * 60 + "\n")

    yield

    # Shutdown
    print("\n" + "=" * 60)
    print("Shutting down...")
    print("=" * 60)

    await close_redis()
    await close_db()

    print("✓ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="API service for running multiple Claude Code instances with session management",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    debug=settings.DEBUG
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Include routers
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(files.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
