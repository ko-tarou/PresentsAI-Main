# PresentsAI E2E Tests

Playwright end-to-end tests against the running stack.

## Prerequisites
The full stack must be running: `make dev` (or docker compose up). Default base URL `http://localhost`.

## Run
```bash
cd e2e
npm install
npx playwright install --with-deps chromium
npm test
```

Override base URL: `E2E_BASE_URL=http://localhost:3000 npm test`
