# AdzryCo Meta-Agent v2

Autonomous X/Twitter AI agent — Claude Sonnet + LangGraph + FastAPI + Next.js 15.

## Stack

| Layer | Tech |
|-------|------|
| AI | Claude Sonnet (`claude-sonnet-4-5-20250929`) + LangGraph |
| Backend | Python 3.12 + FastAPI + Tweepy |
| Frontend | Next.js 15 + TypeScript + Tailwind |
| Database | Supabase (PostgreSQL) |
| Infra | Docker (alongside LEGION stack) |

## Features

- 12 X/Twitter tools: tweet, delete, like, retweet, search, get_user, DM, list, follow, unfollow, analytics, thread
- Human-in-the-loop approval modal for all write actions
- Thread draft → preview → approve → post pipeline
- Real-time streaming SSE responses
- Apple white minimalism UI
- LangGraph 3-agent pipeline: Reasoner → Approver → Executor

## Local Setup

### 1. Backend

```bash
cd adzryco-meta-agent/backend
cp ../.env.example .env
# Fill in .env with your keys
pip install -r requirements.txt
uvicorn main:app --reload
# Backend runs at http://localhost:8000
```

### 2. Frontend

```bash
cd adzryco-meta-agent/frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

### 3. Docker (add to LEGION stack)

```bash
# Copy .env.example → .env and fill in keys
cp .env.example .env

# Add the adzryco-meta-agent service to your existing docker-compose
# (see docker-compose.yml in this repo)
cd C:\Users\User\Projects\docker-poweruser
docker compose up adzryco-meta-agent -d
```

## Supabase Schema

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

-- RLS
alter table conversations enable row level security;
alter table messages enable row level security;
```

## Deploy

### Frontend → Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

```bash
cd frontend
npx vercel --prod
# Set env: NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
```

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set root directory to `adzryco-meta-agent/backend`
3. Add all env vars from `.env.example`
4. Railway auto-detects Python + runs `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Architecture

```
User → Next.js UI → FastAPI (SSE stream)
                       ↓
              LangGraph Agent Graph
              ┌─────────────────────┐
              │ Reasoner Node       │ ← analyzes intent
              │ Thread Draft Node   │ ← if generate_thread
              │ await_approval Node │ ← HITL interrupt
              │ Executor Node       │ ← calls x_tools.py
              └─────────────────────┘
                       ↓
                 Tweepy → X API
```
