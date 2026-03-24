"""
AdzryCo Meta-Agent — FastAPI Main
Streaming SSE + LangGraph HITL approval endpoints
"""
from __future__ import annotations

import asyncio
import json
import sys
import uuid
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from loguru import logger
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import settings
from services.approval_store import get_approval_store
from services.health import build_config_status, build_health_status, build_ready_status

logger.remove()
logger.add(
    sys.stderr,
    level="INFO",
    colorize=True,
    format="<green>{time:HH:mm:ss}</green> | <level>{level}</level> | {message}",
)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title=settings.app_name, version=settings.app_version)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

approval_store = get_approval_store(settings)
logger.info(f"Runtime config: {settings.redacted_dict()}")
logger.info(
    f"Approval store backend: {approval_store.backend_name()} | durable={approval_store.is_durable()}"
)


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


async def stream_agent(request: ChatRequest) -> AsyncGenerator[str, None]:
    from tools.graph import AgentState, agent_graph

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
                approval_store.set(thread_id, {"state": node_state, "config": config})
                yield f"data: {json.dumps({'type': 'approval_required', 'thread_id': thread_id, 'plan': plan, 'thread_draft': thread_draft, 'approval_store': approval_store.backend_name(), 'durable': approval_store.is_durable()})}\n\n"
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

    except Exception as exc:
        logger.error(f"Stream error: {exc}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"


@app.post("/chat/stream")
@limiter.limit("30/minute")
async def chat_stream(body: ChatRequest):
    return StreamingResponse(
        stream_agent(body),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/chat/approve")
async def approve_action(body: ApprovalRequest):
    from tools.graph import agent_graph

    pending = approval_store.get(body.thread_id)
    if not pending:
        raise HTTPException(status_code=404, detail="No pending approval for this thread")

    state = pending["state"]
    config = pending["config"]
    state["approval_granted"] = body.approved
    approval_store.delete(body.thread_id)

    try:
        result_state = None
        async for event in agent_graph.astream(state, config=config):
            node_name = list(event.keys())[0]
            result_state = event[node_name]

        return {
            "success": True,
            "approved": body.approved,
            "approval_store": approval_store.backend_name(),
            "durable": approval_store.is_durable(),
            "result": result_state.get("execution_result", {}) if result_state else {},
        }
    except Exception as exc:
        logger.error(f"Approval resume error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    from database import get_conversations as db_get_convos

    convos = await db_get_convos(user_id)
    return {"conversations": convos}


@app.get("/health")
async def health():
    return await build_health_status(settings)


@app.get("/ready")
async def ready():
    payload, is_ready = await build_ready_status(settings)
    status_code = 200 if is_ready else 503
    return JSONResponse(content=payload, status_code=status_code)


@app.get("/config/status")
async def config_status():
    return await build_config_status(settings)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        log_level="info",
    )
