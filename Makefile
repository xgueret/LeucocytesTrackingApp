# Leucocytes Tracking App — dev stack orchestration
#
# Backend : tsx watch on http://localhost:8081 (API + Swagger)
# Frontend: Vite dev server on http://localhost:3000 (proxies /api -> :8081)

PNPM     := pnpm
BACKEND  := backend
FRONTEND := frontend

# Use a single shell per recipe so trap/wait work across line continuations.
.ONESHELL:
.DEFAULT_GOAL := help

.PHONY: help install dev dev-backend dev-frontend build test lint \
        check-env up down logs clean

## help: show this help
help:
	@echo "Leucocytes — available targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'

## install: install dependencies for backend and frontend
install:
	$(PNPM) --dir $(BACKEND) install
	$(PNPM) --dir $(FRONTEND) install

## check-env: ensure the backend .env exists before starting dev
check-env:
	@if [ ! -f $(BACKEND)/.env ]; then \
		echo "✗ $(BACKEND)/.env is missing — copy it from the template:"; \
		echo "    cp $(BACKEND)/.env.example $(BACKEND)/.env"; \
		exit 1; \
	fi

## dev: run backend and frontend dev servers together (Ctrl+C stops both)
dev: check-env
	@echo "→ backend  http://localhost:8081"
	@echo "→ frontend http://localhost:3000"
	@trap 'kill 0' INT TERM EXIT; \
	$(PNPM) --dir $(BACKEND) dev & \
	$(PNPM) --dir $(FRONTEND) dev & \
	wait

## dev-backend: run only the backend dev server
dev-backend: check-env
	$(PNPM) --dir $(BACKEND) dev

## dev-frontend: run only the frontend dev server
dev-frontend:
	$(PNPM) --dir $(FRONTEND) dev

## build: build backend and frontend for production
build:
	$(PNPM) --dir $(BACKEND) build
	$(PNPM) --dir $(FRONTEND) build

## test: run the test suites for backend and frontend
test:
	$(PNPM) --dir $(BACKEND) test
	$(PNPM) --dir $(FRONTEND) test

## lint: lint the backend sources
lint:
	$(PNPM) --dir $(BACKEND) lint

## up: start the full stack with Docker Compose (detached)
up:
	docker compose up -d --build

## down: stop the Docker Compose stack
down:
	docker compose down

## logs: follow the Docker Compose logs
logs:
	docker compose logs -f

## clean: remove build artifacts and installed dependencies
clean:
	rm -rf $(BACKEND)/dist $(BACKEND)/node_modules
	rm -rf $(FRONTEND)/dist $(FRONTEND)/node_modules
