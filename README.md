# Tableforge AI

A lightweight Next.js (App Router) backend for exploring PostgreSQL schemas with pgvector enabled. It exposes API endpoints to open a database session, introspect tables/columns/constraints, run read-only SQL, and close the session. A seed script populates a demo dataset using faker.

## Features
- ✅ Next.js 16 App Router API routes for DB workflows
  - `POST /api/connect` — open a session and fetch schema snapshot
  - `POST /api/schema` / `GET /api/schema` — retrieve schema snapshot for a session
  - `POST /api/query` — natural-language → SQL preview via `TranslationService` (requires `x-session-id` or `sessionid` header + JSON `{ "nlInput": "..." }`; returns preview + embedding)
  - `POST /api/execute` — run read-only `SELECT` queries
  - `POST /api/disconnect` — close session and release resources
- ✅ PostgreSQL + pgvector via Docker Compose
- ✅ Schema introspection with PK/FK/unique/nullability metadata
- ✅ Session-scoped query execution with timeouts and SELECT-only guardrails
- ✅ Query history/knowledge helpers backed by pgvector (see `KnowledgeService`)
- ✅ Data seeding with `@faker-js/faker`
- ✅ TypeScript-first with `tsx` for scripts

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript 6, Node.js
- PostgreSQL (pgvector, image: `pgvector/pgvector:pg16`)
- Database client: `pg`
- Tooling: `dotenv`, `tsx`, `@faker-js/faker`, `crypto`
- Containerization: Docker Compose

## Project Structure
- `src/app/api/` — Next.js route handlers (`connect`, `schema`, `query`, `execute`, `disconnect`)
- `src/lib/db/DatabaseService.ts` — session management, schema introspection, SELECT execution
- `src/lib/db/KnowledgeService.ts` — pgvector-backed query history utilities
- `src/lib/db/pool.ts` — pool helper
- `scripts/seed.ts` — PostgreSQL seed script using faker
- `docker-compose.yml` — pgvector-enabled Postgres service

## Installation
1) Clone the repo
```bash
git clone <repo-url>
cd tableforge-ai
```
2) Install dependencies
```bash
npm install
```

## Environment Variables
Create a `.env` file at the project root:
```bash
# Postgres (docker-compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tableforge

# Connection string used by scripts/seed.ts
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tableforge

# API default fallbacks (can also be provided in request body)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tableforge
DB_USER=postgres
DB_PASSWORD=postgres

# Anthropic (required for /api/query — TranslationService)
ANTHROPIC_API_KEY=your_key_here
```

## Running the Project
1) Start PostgreSQL (pgvector)
```bash
docker-compose up -d
```
2) Seed demo data (optional but recommended)
```bash
npx tsx scripts/seed.ts
```
3) Run the Next.js dev server
```bash
npm run dev
```
4) Run TypeScript scripts
```bash
npx tsx path/to/script.ts
```

## API Notes
- Only `SELECT` statements are allowed via `/api/execute`; other statements are rejected.
- Schema snapshots include tables, columns, PK/FK/unique, and nullability details from `public` schema.
- Sessions are identified by `sessionId` returned from `/api/connect`; include it in subsequent calls (e.g. header `x-session-id` on `GET /api/schema` and `POST /api/query`).
- `POST /api/query`: send header `x-session-id` (or `sessionid`) and body `{ "nlInput": "<natural language>" }`. Invalid or missing session returns `400` with `Invalid session`. Translation failures return `502`.
