# AdzryCo Meta-Agent v2.2

Autonomous X/Twitter AI agent console with human-in-the-loop approval, runtime diagnostics, and frontend/backend status awareness.

## Stack

| Layer | Tech |
|-------|------|
| AI | Claude Sonnet + LangGraph |
| Backend | Python 3.12 + FastAPI + Tweepy |
| Frontend | Next.js 16 + TypeScript + Tailwind |
| Database | Supabase (PostgreSQL) |
| Infra | Docker |

## Current capabilities

- Runtime truth endpoints: `/health`, `/ready`, `/config/status`
- Human-in-the-loop approval flow for write actions
- Thread draft → preview → approve → post pipeline
- Real-time SSE responses
- Frontend status strip, setup checklist, and runtime diagnostics panel
- Capability-gated quick actions in the sidebar
- Approval store abstraction with memory mode and Redis scaffold

## Current limitations

- Redis approval backend is still a scaffold and is not yet truly durable
- PR branch currently uses draft status until final validation is complete
- Frontend should be built locally after each runtime/status change

## Local setup

### 1. Backend

```bash
cd adzryco-meta-agent/backend
cp ../.env.example .env
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend default:
- `http://localhost:8000`

### 2. Frontend

```bash
cd adzryco-meta-agent/frontend
npm install
npm run dev
```

Frontend default:
- `http://localhost:3000`

Set frontend env if needed:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Runtime endpoints

### `GET /health`
Liveness + dependency summary.

### `GET /ready`
Strict readiness endpoint. Returns `200` only when required runtime dependencies are present and valid.

### `GET /config/status`
Frontend-safe redacted configuration and runtime capability summary.

## Example degraded modes

- Backend offline → frontend status bar shows backend offline
- Anthropic missing → draft and write capabilities should remain limited
- X credentials missing → write actions disabled
- Approval store in memory mode → warnings shown, approvals are ephemeral
- `APPROVAL_STORE_BACKEND=redis` without `REDIS_URL` → readiness degraded

## Supabase schema

Run this SQL in your Supabase project:

```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text default 'New Conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create table scheduled_tweets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  content text not null,
  scheduled_at timestamptz not null,
  status text default 'pending' check (status in ('pending', 'posted', 'failed')),
  tweet_id text,
  created_at timestamptz default now()
);
```

## Docker

```bash
cp .env.example .env
docker compose up adzryco-meta-agent -d
```

`docker-compose.yml` uses `/health` for liveness. Use `/ready` as the stricter semantic readiness signal in deployment environments.

## Architecture

```text
User → Next.js UI → FastAPI (SSE stream)
                       ↓
              LangGraph Agent Graph
              ┌─────────────────────┐
              │ Reasoner Node       │
              │ Thread Draft Node   │
              │ await_approval Node │
              │ Executor Node       │
              └─────────────────────┘
                       ↓
                 Tweepy → X API
```

## Suggested validation before merge

```bash
curl http://localhost:8000/health
curl -i http://localhost:8000/ready
curl http://localhost:8000/config/status

cd frontend
npm run build
```
