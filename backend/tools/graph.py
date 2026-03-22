"""
AdzryCo Meta-Agent — LangGraph Multi-Agent Graph
Reasoner → Approver → Executor pipeline with HITL
"""
from typing import TypedDict, Annotated, Literal, Any
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import json
from loguru import logger
from database import settings

# ── Model ──────────────────────────────────────────────────────────────────
llm = ChatAnthropic(
    model="claude-sonnet-4-5-20250929",
    api_key=settings.anthropic_api_key,
    temperature=0.7,
    max_tokens=4096,
)

# ── State ──────────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: list[dict]
    user_input: str
    intent: str
    action_plan: dict
    requires_approval: bool
    approval_granted: bool
    execution_result: dict
    thread_draft: list[str]
    scheduled_at: str | None
    error: str | None


WRITE_ACTIONS = {
    "create_tweet", "delete_tweet", "like_tweet", "retweet_tweet",
    "create_direct_message", "add_member_to_list", "follow_user",
    "unfollow_user", "post_thread",
}

REASONER_SYSTEM = """You are the Reasoner agent for AdzryCo Meta-Agent, an X/Twitter AI assistant.

Your job: Analyze the user's request and produce a structured action plan.

Available tools:
- create_tweet(text) — post a tweet
- delete_tweet(tweet_id) — delete a tweet
- like_tweet(tweet_id) — like a tweet
- retweet_tweet(tweet_id) — retweet
- search_tweets(query, max_results) — search tweets
- get_user(username) — get user profile
- create_direct_message(username, text) — send DM
- add_member_to_list(list_id, username) — add to list
- follow_user(username) — follow user
- unfollow_user(username) — unfollow user
- get_analytics(tweet_id?) — get analytics
- generate_thread(topic, num_tweets) — draft a thread
- post_thread(tweets) — post a pre-drafted thread

Respond with ONLY valid JSON:
{
  "intent": "brief description of what user wants",
  "action": "tool_name",
  "parameters": { ... },
  "requires_approval": true/false,
  "reasoning": "why this action"
}

requires_approval must be true for: create_tweet, delete_tweet, like_tweet, retweet_tweet,
create_direct_message, add_member_to_list, follow_user, unfollow_user, post_thread.
"""

THREAD_SYSTEM = """You are a viral X/Twitter content writer for @AdzryCo.
Write a thread about the given topic. Each tweet must be under 280 characters.
First tweet is the hook (attention-grabbing, no hashtags).
Middle tweets provide value. Last tweet is a CTA.
Respond with ONLY a JSON array of strings: ["tweet1", "tweet2", ...]
Number of tweets: {num_tweets}
"""

EXECUTOR_SYSTEM = """You are the Executor agent. 
Execute the approved action and return a clear, friendly response to the user.
Always confirm what was done and provide relevant details.
"""


# ── Nodes ──────────────────────────────────────────────────────────────────
async def reasoner_node(state: AgentState) -> AgentState:
    """Analyze intent and plan the action."""
    logger.info(f"Reasoner processing: {state['user_input'][:100]}")
    try:
        response = await llm.ainvoke([
            SystemMessage(content=REASONER_SYSTEM),
            HumanMessage(content=state["user_input"]),
        ])
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        plan = json.loads(raw)
        return {
            **state,
            "intent": plan.get("intent", ""),
            "action_plan": plan,
            "requires_approval": plan.get("requires_approval", False),
            "error": None,
        }
    except Exception as e:
        logger.error(f"Reasoner error: {e}")
        return {**state, "error": str(e), "requires_approval": False}


async def thread_draft_node(state: AgentState) -> AgentState:
    """Draft a thread if action is generate_thread."""
    plan = state.get("action_plan", {})
    if plan.get("action") != "generate_thread":
        return state
    params = plan.get("parameters", {})
    topic = params.get("topic", state["user_input"])
    num_tweets = params.get("num_tweets", 5)
    try:
        system = THREAD_SYSTEM.format(num_tweets=num_tweets)
        response = await llm.ainvoke([
            SystemMessage(content=system),
            HumanMessage(content=f"Write a thread about: {topic}"),
        ])
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        tweets = json.loads(raw)
        updated_plan = {**plan, "action": "post_thread", "parameters": {"tweets": tweets}}
        return {
            **state,
            "thread_draft": tweets,
            "action_plan": updated_plan,
            "requires_approval": True,
        }
    except Exception as e:
        logger.error(f"Thread draft error: {e}")
        return {**state, "error": str(e)}


async def executor_node(state: AgentState) -> AgentState:
    """Execute the approved action."""
    from tools import x_tools
    plan = state.get("action_plan", {})
    action = plan.get("action", "")
    params = plan.get("parameters", {})
    logger.info(f"Executor running: {action} with {params}")
    try:
        tool_fn = getattr(x_tools, action, None)
        if tool_fn is None:
            return {**state, "execution_result": {"success": False, "error": f"Unknown action: {action}"}}
        result = tool_fn(**params)
        response = await llm.ainvoke([
            SystemMessage(content=EXECUTOR_SYSTEM),
            HumanMessage(content=f"Action: {action}\nResult: {json.dumps(result)}\nGenerate a friendly user response."),
        ])
        return {
            **state,
            "execution_result": {**result, "user_message": response.content},
        }
    except Exception as e:
        logger.error(f"Executor error: {e}")
        return {**state, "execution_result": {"success": False, "error": str(e)}}


async def read_only_executor_node(state: AgentState) -> AgentState:
    """Execute read-only actions without approval."""
    return await executor_node(state)


def approval_router(state: AgentState) -> Literal["await_approval", "execute_read", "error"]:
    if state.get("error"):
        return "error"
    if state.get("requires_approval"):
        return "await_approval"
    return "execute_read"


def post_approval_router(state: AgentState) -> Literal["execute", "rejected"]:
    if state.get("approval_granted"):
        return "execute"
    return "rejected"


async def error_node(state: AgentState) -> AgentState:
    return {**state, "execution_result": {"success": False, "error": state.get("error", "Unknown error")}}


async def rejected_node(state: AgentState) -> AgentState:
    return {**state, "execution_result": {"success": False, "error": "Action rejected by user."}}


async def await_approval_node(state: AgentState) -> AgentState:
    """Pause point — approval comes from the frontend via interrupt."""
    return state


# ── Graph ──────────────────────────────────────────────────────────────────
def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    graph.add_node("reasoner", reasoner_node)
    graph.add_node("thread_draft", thread_draft_node)
    graph.add_node("await_approval", await_approval_node)
    graph.add_node("executor", executor_node)
    graph.add_node("read_only_executor", read_only_executor_node)
    graph.add_node("error", error_node)
    graph.add_node("rejected", rejected_node)

    graph.set_entry_point("reasoner")
    graph.add_edge("reasoner", "thread_draft")
    graph.add_conditional_edges("thread_draft", approval_router, {
        "await_approval": "await_approval",
        "execute_read": "read_only_executor",
        "error": "error",
    })
    graph.add_conditional_edges("await_approval", post_approval_router, {
        "execute": "executor",
        "rejected": "rejected",
    })
    graph.add_edge("executor", END)
    graph.add_edge("read_only_executor", END)
    graph.add_edge("error", END)
    graph.add_edge("rejected", END)

    memory = MemorySaver()
    return graph.compile(checkpointer=memory, interrupt_before=["await_approval"])


agent_graph = build_graph()
