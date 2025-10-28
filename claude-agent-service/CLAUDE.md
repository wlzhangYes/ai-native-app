# Claude Code Configuration

This file configures Claude Code's behavior for this project.

## Project Context

This is a Claude Agent Service built with FastAPI, PostgreSQL, and Redis. It provides a RESTful API for managing multiple Claude Code sessions with workspace isolation.

## Tech Stack

- **Backend**: FastAPI 0.115, Python 3.11+
- **Database**: PostgreSQL 16 with SQLAlchemy 2.0 (async)
- **Cache**: Redis 7
- **ORM**: SQLAlchemy (async)
- **Validation**: Pydantic 2.9
- **Migration**: Alembic
- **Container**: Docker & Docker Compose

## Project Structure

```
app/
├── core/          # Core configuration (database, redis, settings)
├── models/        # SQLAlchemy database models
├── schemas/       # Pydantic validation schemas
├── services/      # Business logic layer
├── api/           # FastAPI route handlers
└── utils/         # Utility functions
```

## Development Guidelines

### Code Style

- Use **async/await** for all I/O operations
- Follow **PEP 8** style guide
- Use **type hints** for all function parameters and returns
- Write **docstrings** for modules, classes, and functions
- Use **f-strings** for string formatting

### Architecture Patterns

1. **Layered Architecture**
   - API layer handles HTTP requests/responses
   - Service layer contains business logic
   - Model layer defines data structure
   - Schema layer validates data

2. **Dependency Injection**
   - Use FastAPI's `Depends()` for database sessions
   - Services should be stateless and injected

3. **Error Handling**
   - Raise HTTPException with appropriate status codes
   - Use try-except for database operations
   - Always rollback on errors

### Database Operations

- Always use **async session** from `get_db()`
- Use **transactions** for multi-step operations
- Call `await db.commit()` after successful operations
- Call `await db.rollback()` on errors
- Use `select()` instead of `query()` for SQLAlchemy 2.0

Example:
```python
async def create_item(db: AsyncSession, data: dict):
    try:
        item = Item(**data)
        db.add(item)
        await db.flush()
        await db.refresh(item)
        await db.commit()
        return item
    except Exception as e:
        await db.rollback()
        raise
```

### API Endpoints

- Use **router prefixes**: `/api/sessions`, `/api/chat`
- Return **Pydantic schemas** for responses
- Use **status codes**: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error)
- Add **docstrings** to endpoint functions

### Environment Variables

Always use `settings` from `app.core.config`:
```python
from app.core.config import settings

# Good
database_url = settings.DATABASE_URL

# Bad - don't use os.getenv() directly
database_url = os.getenv("DATABASE_URL")
```

## Common Tasks

### Adding a New API Endpoint

1. Create/update router in `app/api/`
2. Define Pydantic schemas in `app/schemas/`
3. Implement business logic in `app/services/`
4. Register router in `app/main.py`

### Adding a Database Model

1. Create model in `app/models/`
2. Import model in `app/core/database.py`
3. Create migration:
   ```bash
   alembic revision --autogenerate -m "Add new model"
   ```
4. Review and apply migration:
   ```bash
   alembic upgrade head
   ```

### Adding a Service Method

1. Add method to appropriate service in `app/services/`
2. Use dependency injection for database session
3. Handle errors with try-except
4. Update cache if using Redis

## Testing

- Write tests in `tests/` directory
- Use `pytest` for testing
- Mock external dependencies (database, Redis, Claude SDK)
- Test both success and error cases

## Docker Development

### Local Development
```bash
# Start only database and redis
docker-compose up -d postgres redis

# Run app locally
make dev
```

### Full Stack
```bash
# Start all services
make up

# View logs
make logs

# Enter container
make shell
```

## Common Commands

```bash
# Development
make dev              # Run development server
make install          # Install dependencies

# Docker
make build            # Build images
make up               # Start services
make down             # Stop services
make logs             # View logs
make restart          # Restart services

# Database
make migrate          # Create migration
make db-upgrade       # Apply migrations
make db-downgrade     # Rollback migration
make psql             # PostgreSQL shell

# Redis
make redis-cli        # Redis CLI

# Code Quality
make format           # Format code with black
make lint             # Run linter
```

## Important Notes

### Claude SDK Integration

The service uses `claude-agent-sdk` to integrate with Claude Code:

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

options = ClaudeAgentOptions(
    env=get_claude_env(),
    cwd=workspace_path,
    permission_mode="acceptEdits",
    system_prompt={"type": "preset", "preset": "claude_code"},
    setting_sources=['project'],
    settings=settings_path
)

async with ClaudeSDKClient(options=options) as client:
    await client.query(message)
    async for message in client.receive_response():
        # Handle streaming response
        pass
```

### Session Management

- Each session has isolated workspace directory
- Workspace contains `.claude/` configuration
- Session info cached in Redis
- Session metadata stored in PostgreSQL

### Streaming Responses

Chat API uses Server-Sent Events (SSE):
```python
async def generate():
    yield f"data: {json.dumps(event_data)}\n\n"

return StreamingResponse(
    generate(),
    media_type="text/event-stream"
)
```

## Security Considerations

1. **Never commit sensitive data**
   - API tokens should be in `.env`
   - Use `.env.example` for documentation

2. **Database Security**
   - Use strong passwords
   - Enable connection pooling
   - Use prepared statements (SQLAlchemy handles this)

3. **API Security**
   - Add authentication if deploying publicly
   - Use HTTPS in production
   - Validate all input data with Pydantic

## Performance Tips

1. **Database**
   - Use connection pooling (already configured)
   - Index frequently queried columns
   - Use `select()` with specific columns instead of `*`

2. **Redis**
   - Cache frequently accessed data
   - Set appropriate TTL values
   - Use Redis for session state

3. **API**
   - Use async/await everywhere
   - Stream large responses
   - Set connection timeouts

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U claude_agent -d claude_agent_db
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
```

### Migration Issues
```bash
# Check current version
alembic current

# View history
alembic history

# Rollback and retry
alembic downgrade -1
alembic upgrade head
```

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Redis Python Client](https://redis-py.readthedocs.io/)
