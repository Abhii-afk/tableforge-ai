# Tableforge AI

An AI-powered SQL query generator that translates natural language to SQL using Google Gemini. Built with Next.js, PostgreSQL, and pgvector for schema introspection and semantic search.

**Key Feature:** Ask questions in plain English → Gemini AI generates SQL → Preview with risk assessment

## 🎯 Features

### AI Query Translation
- ✅ **Natural Language to SQL**: `"Show all users"` → `SELECT id, name, email FROM users`
- ✅ **Risk Assessment**: `low` / `medium` / `high` based on operation type (SELECT vs DELETE)
- ✅ **Google Gemini Integration**: Uses `gemini-2.5-flash` model for fast, accurate SQL generation
- ✅ **JSON Response**: SQL preview with explanation, operation type, and risk level

### Database Management
- ✅ **PostGreSQL + pgvector**: Full schema introspection with vector support
- ✅ **Session-based**: Create isolated database sessions with unique session IDs
- ✅ **Schema Introspection**: Auto-discover tables, columns, constraints (PK/FK/unique)
- ✅ **SELECT-only Execution**: Read-only queries with timeout protection

### Development & Testing
- ✅ **Docker Compose**: Pre-configured PostgreSQL (pgvector) with one command
- ✅ **Demo Data Seeding**: Faker.js generates 100+ realistic test records
- ✅ **TypeScript-first**: Full type safety with `tsx` scripts

## 📊 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19, TypeScript 6 |
| **Backend** | Next.js 16 (App Router) |
| **Database** | PostgreSQL 16 (pgvector) |
| **AI Model** | Google Gemini 2.5 Flash |
| **Database Client** | pg (Node.js native) |
| **Containerization** | Docker & Docker Compose |

## 📁 Project Structure

```
tableforge-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── connect/       # POST - Open DB session & get schema
│   │   │   ├── query/         # POST - Translate NL → SQL via Gemini
│   │   │   ├── schema/        # GET/POST - Fetch current schema
│   │   │   ├── execute/       # POST - Run SELECT queries
│   │   │   └── disconnect/    # POST - Close session
│   │   ├── layout.tsx
│   │   ├── page.tsx           # UI for testing
│   │   └── globals.css
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts      # Gemini client initialization
│   │   │   └── TranslationService.ts  # NL → SQL translation
│   │   └── db/
│   │       ├── DatabaseService.ts     # Session & query management
│   │       ├── KnowledgeService.ts    # pgvector query history
│   │       └── pool.ts               # Connection pool config
│   └── ...
├── scripts/
│   ├── seed.ts                # Generate demo data
│   ├── test-introspection.ts  # Schema inspection test
│   └── demo-reset.ts          # Clear & reseed database
├── docker-compose.yml         # PostgreSQL container config
├── package.json
├── .env.example              # Environment template
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose installed
- Google Gemini API key (free at https://aistudio.google.com/app/apikey)

### 1. Clone & Install
```bash
git clone https://github.com/Abhii-afk/tableforge-ai.git
cd tableforge-ai
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add:
# - DB_PASSWORD=your_password
# - GEMINI_API_KEY=your_api_key_from_https://aistudio.google.com
```

### 3. Start PostgreSQL
```bash
docker-compose up -d
# Verify: docker ps (should show postgres container)
```

### 4. Seed Demo Data
```bash
npx tsx scripts/seed.ts
# Creates: users, products, orders, order_items, reviews (100+)
```

### 5. Run Dev Server
```bash
npm run dev
# Open http://localhost:3001
```

### 6. Test AI Translation
In the browser UI, try:
- `"Show all users"` → `SELECT id, name, email, status, created_at FROM users`
- `"Find expensive products"` → `SELECT * FROM products WHERE price > 500`
- `"Delete all orders"` → `DELETE FROM orders` (high risk ⚠️)

## 🔌 API Endpoints

All endpoints require `x-session-id` header from `/api/connect` (except connect itself).

### `POST /api/connect`
Opens a new database session and returns schema snapshot.

**Request:**
```json
{
  "host": "127.0.0.1",
  "port": 5433,
  "database": "wtc",
  "user": "postgres",
  "password": "your_password"
}
```
(All fields optional; uses `.env` defaults)

**Response:**
```json
{
  "sessionId": "uuid-here",
  "schemaSnapshot": {
    "users": {
      "columns": [
        { "name": "id", "type": "uuid", "primaryKey": true },
        { "name": "name", "type": "text", "nullable": true }
      ],
      "foreignKeys": []
    }
  }
}
```

### `POST /api/query` ⭐ AI Query Generation
Translates natural language to SQL using Gemini.

**Headers:**
```
x-session-id: uuid-from-connect
Content-Type: application/json
```

**Request:**
```json
{
  "nlInput": "Show all users with email domain example.com"
}
```

**Response:**
```json
{
  "sql": "SELECT id, name, email FROM users WHERE email LIKE '%@example.com'",
  "explanation": "Filters users by email domain",
  "operation": "SELECT",
  "risk": "low",
  "riskReason": "SELECT operations don't modify data",
  "embedding": []
}
```

### `POST /api/execute`
Executes SELECT queries only.

**Request:**
```json
{
  "query": "SELECT COUNT(*) FROM users"
}
```

**Response:**
```json
{
  "rows": [{ "count": 100 }],
  "rowCount": 1
}
```

### `GET /api/schema` or `POST /api/schema`
Retrieves current schema for the session.

**Response:**
```json
{
  "users": { "columns": [...], "foreignKeys": [...] },
  "products": { "columns": [...], "foreignKeys": [...] }
}
```

### `POST /api/disconnect`
Closes the session and releases database connection.

## 🧠 How Gemini Integration Works

### Flow
1. **User Input** → Natural language question in UI
2. **Session Check** → Verify valid session ID
3. **Schema Context** → Pass table/column info to Gemini
4. **Gemini Prompt** → `"Given schema X, generate SQL for: Y"`
5. **Response Parsing** → Extract JSON from Gemini's output
6. **Validation** → Check for required fields (sql, operation, risk)
7. **Risk Assessment** → Set risk level based on SQL operation
8. **Return to User** → SQL preview with metadata

### TranslationService (`src/lib/ai/TranslationService.ts`)

**Key Methods:**

- `translate()` - Main NL→SQL conversion
  - Builds system prompt with schema context
  - Calls Gemini API with optimized prompt
  - Parses JSON from markdown-wrapped response
  - Validates response structure
  - Returns SQL with risk assessment

- `validateResponse()` - Type validation
  - Checks all required fields exist
  - Validates operation enum: SELECT|INSERT|UPDATE|DELETE|DDL
  - Validates risk enum: low|medium|high

- `extractJsonFromText()` - Robust JSON extraction
  - Handles markdown-wrapped responses ` ```json ... ``` `
  - Falls back to regex if JSON parsing fails

- `applySelectSafetyFallback()` - Risk assessment
  - Flags DELETE/INSERT/UPDATE as high risk
  - SELECT operations default to low risk
  - Provides risk reasoning

### Prompting Strategy

The system prompt includes:
- Full database schema (tables, columns, types, constraints)
- SQL generation rules (SELECT-only, no harmful operations)
- Output format requirements (valid JSON)
- Risk assessment guidelines

Example instruction given to Gemini:
```
Generate ONLY a SELECT or INSERT statement based on the user's question.
Return ONLY valid JSON with this exact structure:
{
  "sql": "SELECT ...",
  "explanation": "...",
  "operation": "SELECT|INSERT|UPDATE|DELETE|DDL",
  "risk": "low|medium|high",
  "riskReason": "..."
}
```

## 📊 Demo Data

Run `npx tsx scripts/seed.ts` to populate:
- **Users**: 100 records (name, email, status, created_at)
- **Products**: 50 records (name, price)
- **Orders**: 100 records (user_id, created_at)
- **Order Items**: 200 records (order_id, product_id, quantity)
- **Reviews**: 50 records (user_id, product_id, rating)
- **Legacy Users**: 20 records (name, active)

Data generated by `@faker-js/faker` with realistic variations.

## 🔧 Scripts

### Seed Database
```bash
npx tsx scripts/seed.ts
```
Creates tables and inserts 400+ fake records.

### Test Introspection
```bash
npx tsx scripts/test-introspection.ts
```
Validates schema parsing logic.

### Reset Demo
```bash
npx tsx scripts/demo-reset.ts
```
Drops all tables and reseeds fresh data.

## 📝 Environment Variables

```bash
# Database
DB_HOST=127.0.0.1
DB_PORT=5433               # Custom port (avoid conflict with local Postgres)
DB_NAME=wtc
DB_USER=postgres
DB_PASSWORD=your_password
DATABASE_URL=postgresql://user:pass@host:port/db

# Docker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=wtc

# AI
GEMINI_API_KEY=your_key_from_aistudio.google.com
```

## ✅ Testing the Full Flow

```bash
# 1. Start everything
docker-compose up -d
npm run dev

# 2. In browser (http://localhost:3001):
# - Session opens automatically
# - Shows "schema snapshot: 5 tables"
# - Try: "show all users"
# - Click "Generate SQL"
# - Result: SQL preview with risk level ✅

# 3. Or test via curl:
SESSION=$(curl -X POST http://localhost:3001/api/connect -H "Content-Type: application/json" -d '{}' | jq -r '.sessionId')
curl -X POST http://localhost:3001/api/query \
  -H "x-session-id: $SESSION" \
  -H "Content-Type: application/json" \
  -d '{"nlInput":"Show all users"}' | jq
```

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check Docker container: `docker ps`
- Verify `.env` has correct DB_HOST (try `127.0.0.1` on Windows)
- Check port 5433 is open: `sudo lsof -i :5433`

### "GEMINI_API_KEY is not set"
- Create `.env` with your key from https://aistudio.google.com/app/apikey
- Verify `.env` is in project root (not .env.example)

### "models/gemini-2.5-flash is not found"
- Your API key may not have access
- Try using a different Gemini model: `gemini-1.5-flash`, `gemini-2.0-flash`
- Check key quota/billing in Google Cloud Console

### "Schema snapshot: 0 tables"
- Run seed script: `npx tsx scripts/seed.ts`
- Refresh browser after seeding

## 🚀 Deployment

For production, replace `.env` values with:
- Secure database (AWS RDS, Railway, etc.)
- Vercel for Node.js hosting
- Environment variables in platform secrets

## 📚 Further Reading

- [Gemini API Docs](https://ai.google.dev/)
- [PostgreSQL with pgvector](https://github.com/pgvector/pgvector)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Docker Compose Docs](https://docs.docker.com/compose/)

## 📜 License

MIT

## 👤 Author

AI-powered SQL translation for modern development
