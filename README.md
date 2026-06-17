# PresentsAI

![CI](https://github.com/ko-tarou/PresentsAI-Main/actions/workflows/ci.yml/badge.svg)

AI-powered presentation editor built with Next.js, Fabric.js, and Go microservices.

## Testing

| Layer | Tool | Command |
|-------|------|---------|
| Web unit | Vitest + Testing Library | `cd web && npm test` |
| Go unit | go test | `cd services/api && go test ./...` |
| E2E | Playwright | `cd e2e && npm test` (stack must be running) |

CI runs all of the above on every PR via GitHub Actions (`.github/workflows/ci.yml`).

## Features

- Canvas-based slide editor (Fabric.js v6) with full object manipulation
- AI content generation and real-time speech coaching via LFM2 local model
- Collaborative editing via WebSocket
- Real-time presenter-to-audience slide sync
- Export to PDF, PNG, SVG, and PPTX
- Design tokens (colors, text styles), component library, auto-layout
- Bezier pen tool, node editor, boolean path operations
- Image filters (brightness, blur, grayscale)
- Slide version history with restore
- Comment system per presentation/slide
- Keyboard shortcuts, accessibility (ARIA), and responsive design

## Architecture

```
PresentsAI/
├── web/                    # Next.js 15 frontend (App Router)
├── services/
│   ├── api/                # Go REST API (Gorilla Mux + GORM + PostgreSQL)
│   ├── collab/             # Go WebSocket collaboration service (:8081)
│   ├── realtime/           # Go WebSocket presenter-viewer sync (:8082)
│   └── assets/             # Go static asset service (:8083)
└── infra/
    └── nginx/              # Reverse proxy routing
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Canvas | Fabric.js v6 |
| AI | LFM2-2.6B via local OpenAI-compatible gateway |
| API | Go 1.23, Gorilla Mux, GORM |
| Database | PostgreSQL (uuid-ossp, JSONB) |
| Auth | JWT (access + refresh tokens) |
| Realtime | WebSocket (gorilla/websocket) |
| Infra | Docker Compose, Nginx |

## Quick Start

**Prerequisites:** Docker, Docker Compose, Node.js 20+, Go 1.23+

```bash
# Start all services (API, DB, Collab, Realtime, Nginx)
make dev

# Or individually:
cd web && npm install && npm run dev   # Frontend at :3000
cd services/api && go run ./cmd/api   # API at :8080
cd services/collab && go run ./cmd/collab   # Collab WS at :8081
cd services/realtime && go run ./cmd/realtime  # Realtime WS at :8082
```

## AI Features Setup

The AI speaker-notes / content generation feature talks to any local
**OpenAI-compatible** chat endpoint (`POST /v1/chat/completions`). No external
API is used. The `/api/ai/chat` route reads two server-side env vars:

- `LLM_GATEWAY_URL` — base URL of the local gateway (the route appends
  `/v1/chat/completions`; a trailing `/v1` is tolerated). Default
  `http://localhost:4242`.
- `LLM_MODEL` — model name sent to the gateway. Default `lfm2-2.6b-f16`.

Option A - Ollama (CLI):

```bash
# One-time (requires user-approved global install):
brew install ollama
ollama pull qwen2.5:3b        # ~2 GB; or llama3.2:3b
ollama serve                  # OpenAI-compatible on :11434
# Then in web/.env.local:
#   LLM_GATEWAY_URL=http://localhost:11434
#   LLM_MODEL=qwen2.5:3b
```

Option B - LM Studio (GUI):

```bash
# Download a model in LM Studio, start its OpenAI-compatible server on :4242.
# Then in web/.env.local:
#   LLM_GATEWAY_URL=http://localhost:4242
#   LLM_MODEL=<the model id LM Studio reports>
```

Real-time speech coaching uses the Web Speech API (Chrome/Edge only) and is
independent of the gateway.

## Environment Variables

```env
# services/api/.env
DATABASE_URL=postgres://user:pass@localhost:5432/presentsai
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=8080

# web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_COLLAB_URL=ws://localhost:8081
NEXT_PUBLIC_REALTIME_URL=ws://localhost:8082

# AI gateway (server-side; read by /api/ai/chat). OpenAI-compatible endpoint.
LLM_GATEWAY_URL=http://localhost:4242   # Ollama: http://localhost:11434
LLM_MODEL=lfm2-2.6b-f16                 # Ollama: qwen2.5:3b
```

## PR History (021-040)

| PR | Feature |
|----|---------|
| 021 | Real-time AI speech coaching with filler word detection |
| 022 | Post-presentation AI report with score and feedback |
| 023 | WebSocket presenter-to-audience slide sync service |
| 024 | Comment system (per presentation/slide) |
| 025 | Slide version history with restore |
| 026 | Bezier pen tool with path preview |
| 027 | Node/vertex editor for path manipulation |
| 028 | Boolean path operations (union/subtract/intersect/exclude) |
| 029 | Reusable component library with save/instantiate |
| 030 | Auto-layout and distribute alignment tools |
| 031 | Design token system (colors, text styles) |
| 032 | Freehand drawing mode and SVG import |
| 033 | Rich text (bullet lists, line height, letter spacing) |
| 034 | Image filters (brightness, blur, grayscale) |
| 035 | Slide add/delete from slide panel with API sync |
| 036 | Comprehensive keyboard shortcuts |
| 037 | Presentation share link button |
| 038 | Accessibility (ARIA labels, roles, skip links) |
| 039 | Dashboard search and sort for presentations |
| 040 | README documentation update |
