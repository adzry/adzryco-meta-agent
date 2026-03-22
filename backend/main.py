"""
AdzryCo Meta-Agent — FastAPI Main
Streaming SSE + LangGraph HITL approval endpoints
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
import json
import uuid
import asyncio
import sys

# ── Logging ────────────────────────────────────────────────────────────────
logger.remove()
logger.add(sys.stderr, level="INFO", colorize=True,
           format="<green>{time:HH:mm:ss}</green> | <level>{level}</level> | {message}")

# ── App ────────────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="AdzryCo Meta-Agent", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://adzryco-meta-agent.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: str = "default"

class ApprovalRequest(BaseModel):
    thread_id: str
    approved: bool

class ScheduleRequest(BaseModel):
    message: str
    scheduled_at: str
    user_id: str = "default"

# ── In-memory pending approvals store (use Redis in production) ────────────
pending_approvals: dict = {}

# ── Streaming chat ─────────────────────────────────────────────────────────
async def stream_agent(request: ChatRequest) -> AsyncGenerator[str, None]:
    from tools.graph import agent_graph, AgentState
    thread_id = request.conversation_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    initial_state: AgentState = {
        "messages": [],
        "user_input": request.message,
        "intent": "",
        "action_plan": {},
        "requires_approval": False,
        "approval_granted": False,
        "execution_result": {},
        "thread_draft": [],
        "scheduled_at": None,
        "error": None,
    }

    yield f"data: {json.dumps({'type': 'thinking', 'thread_id': thread_id})}\n\n"
    await asyncio.sleep(0.1)

    try:
        async for event in agent_graph.astream(initial_state, config=config):
            node_name = list(event.keys())[0]
            node_state = event[node_name]

            if node_name == "reasoner":
                intent = node_state.get("intent", "")
                plan = node_state.get("action_plan", {})
                yield f"data: {json.dumps({'type': 'reasoning', 'intent': intent, 'plan': plan})}\n\n"

            elif node_name == "thread_draft":
                draft = node_state.get("thread_draft", [])
                if draft:
                    yield f"data: {json.dumps({'type': 'thread_draft', 'tweets': draft})}\n\n"

            elif node_name == "await_approval":
                plan = node_state.get("action_plan", {})
                thread_draft = node_state.get("thread_draft", [])
                pending_approvals[thread_id] = {"state": node_state, "config": config}
                yield f"data: {json.dumps({'type': 'approval_required', 'thread_id': thread_id, 'plan': plan, 'thread_draft': thread_draft})}\n\n"
                return

            elif node_name in ("executor", "read_only_executor"):
                result = node_state.get("execution_result", {})
                user_msg = result.get("user_message", str(result))
                yield f"data: {json.dumps({'type': 'result', 'message': user_msg, 'data': result})}\n\n"

            elif node_name == "error":
                error = node_state.get("execution_result", {}).get("error", "Unknown error")
                yield f"data: {json.dumps({'type': 'error', 'message': error})}\n\n"

            elif node_name == "rejected":
                yield f"data: {json.dumps({'type': 'rejected', 'message': 'Action cancelled.'})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@app.post("/chat/stream")
@limiter.limit("30/minute")
async def chat_stream(request: Request, body: ChatRequest):
    return StreamingResponse(
        stream_agent(body),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/chat/approve")
async def approve_action(body: ApprovalRequest):
    """Resume the graph after human approval/rejection."""
    from tools.graph import agent_graph
    pending = pending_approvals.get(body.thread_id)
    if not pending:
        raise HTTPException(status_code=404, detail="No pending approval for this thread")

    state = pending["state"]
    config = pending["config"]
    state["approval_granted"] = body.approved
    del pending_approvals[body.thread_id]

    try:
        result_state = None
        async for event in agent_graph.astream(state, config=config):
            node_name = list(event.keys())[0]
            result_state = event[node_name]
        return {
            "success": True,
            "approved": body.approved,
            "result": result_state.get("execution_result", {}) if result_state else {},
        }
    except Exception as e:
        logger.error(f"Approval resume error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    from database import get_conversations as db_get_convos
    convos = await db_get_convos(user_id)
    return {"conversations": convos}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "adzryco-meta-agent"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
