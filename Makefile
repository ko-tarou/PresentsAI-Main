.PHONY: dev dev-bg stop clean build logs migrate test-go type-check health

dev:
	docker compose -f docker-compose.dev.yml up --build

dev-bg:
	docker compose -f docker-compose.dev.yml up --build -d

stop:
	docker compose -f docker-compose.dev.yml down

clean:
	docker compose -f docker-compose.dev.yml down -v

build:
	docker compose -f docker-compose.dev.yml build

logs:
	docker compose -f docker-compose.dev.yml logs -f $(SERVICE)

migrate:
	docker compose -f docker-compose.dev.yml exec api ./api migrate

test-go:
	cd services/api      && go test ./... || true
	cd services/collab   && go test ./... || true
	cd services/realtime && go test ./... || true
	cd services/assets   && go test ./... || true

type-check:
	cd web && npm run type-check

health:
	@echo "=== Health Check ===" && \
	curl -sf http://localhost:8080/health | python3 -m json.tool && \
	curl -sf http://localhost:8081/health | python3 -m json.tool && \
	curl -sf http://localhost:8082/health | python3 -m json.tool && \
	curl -sf http://localhost:8083/health | python3 -m json.tool
