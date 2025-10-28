.PHONY: help install dev build up down logs restart clean migrate db-upgrade db-downgrade test format lint

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pip install -r requirements.txt

dev: ## Run in development mode
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Show logs
	docker-compose logs -f

restart: ## Restart all services
	docker-compose restart

clean: ## Clean up containers, volumes, and workspace
	docker-compose down -v
	rm -rf workspace/*

migrate: ## Create a new migration
	alembic revision --autogenerate -m "$(msg)"

db-upgrade: ## Run database migrations
	alembic upgrade head

db-downgrade: ## Rollback database migration
	alembic downgrade -1

db-reset: ## Reset database
	alembic downgrade base
	alembic upgrade head

test: ## Run tests
	pytest

format: ## Format code with black
	black app/

lint: ## Run linter
	flake8 app/

shell: ## Open shell in app container
	docker-compose exec app /bin/bash

psql: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U claude_agent -d claude_agent_db

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli
