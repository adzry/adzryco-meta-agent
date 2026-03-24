"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import ApprovalModal from "./components/ApprovalModal";
import SystemStatusBar from "./components/SystemStatusBar";
import SystemStatusPanel from "./components/SystemStatusPanel";
import SetupChecklist from "./components/SetupChecklist";
import { Message, ApprovalData, ConversationMeta } from "./components/types";
import { Menu, X } from "lucide-react";
import { fetchConfigStatus, fetchHealth } from "../lib/api/system";
import { getApiUrl } from "../lib/config";
import { ConfigStatusResponse, HealthResponse } from "../lib/types/system";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [approval, setApproval] = useState<ApprovalData | null>(null);
  const [threadPreview, setThreadPreview] = useState<string[] | null>(null);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [configStatus, setConfigStatus] = useState<ConfigStatusResponse | null>(null);
  const [runtimeOffline, setRuntimeOffline] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canRead = !runtimeOffline;
  const canDraft = !runtimeOffline && Boolean(configStatus?.services.anthropic);
  const canWrite = canDraft && Boolean(configStatus?.services.x_api);

  const connectionHint = useMemo(() => {
    if (runtimeOffline) return "Connection error. Backend is offline or NEXT_PUBLIC_API_URL is wrong.";
    if (!configStatus?.services.anthropic) return "Anthropic key missing. Draft/write actions are limited.";
    if (!configStatus?.services.x_api) return "X credentials missing. Write actions remain disabled.";
    return "";
  }, [runtimeOffline, configStatus]);

  const refreshRuntime = async () => {
    try {
      const [healthData, configData] = await Promise.all([fetchHealth(), fetchConfigStatus()]);
      setHealth(healthData);
      setConfigStatus(configData);
      setRuntimeOffline(false);
    } catch {
      setRuntimeOffline(true);
    }
  };

  useEffect(() => {
    void refreshRuntime();
  }, []);

  const handleSubmit = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isStreaming) return;

    if (!canRead) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Backend is offline. Start the API service or fix NEXT_PUBLIC_API_URL first.", id: `offline-${Date.now()}`, isError: true },
      ]);
      return;
    }

    setInput("");
    setMobileSidebarOpen(false);

    const userMessage: Message = { role: "user", content: msg, id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setMessages(prev => [...prev, { role: "assistant", content: "", id: "thinking", isThinking: true }]);
    setIsStreaming(true);

    try {
      abortRef.current = new AbortController();
      const res = await fetch(getApiUrl("/chat/stream"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversation_id: conversationId, user_id: "adzry" }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Backend request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const data = JSON.parse(line.replace("data: ", ""));
          if (data.thread_id && !conversationId) setConversationId(data.thread_id);

          if (data.type === "reasoning") {
            const assistantContent = `🧠 **Analyzing:** ${data.intent}`;
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: assistantContent, isThinking: false } : m));
          } else if (data.type === "thread_draft") {
            setThreadPreview(data.tweets);
          } else if (data.type === "approval_required") {
            setApproval({ threadId: data.thread_id, plan: data.plan, threadDraft: data.thread_draft });
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: `⏳ **Waiting for approval** — ${data.plan?.intent || "action pending"}`, isThinking: false, id: Date.now().toString() } : m));
            setIsStreaming(false);
            return;
          } else if (data.type === "result") {
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: data.message, isThinking: false, id: Date.now().toString() } : m));
          } else if (data.type === "error") {
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: `❌ ${data.message}`, isThinking: false, isError: true, id: Date.now().toString() } : m));
          } else if (data.type === "rejected") {
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: "Action cancelled.", isThinking: false, id: Date.now().toString() } : m));
          }
        }
      }
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort) {
        setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: connectionHint || "Connection error. Is the backend running?", isThinking: false, isError: true, id: `err-${Date.now()}` } : m));
        setRuntimeOffline(true);
      }
    } finally {
      setIsStreaming(false);
      void refreshRuntime();
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!approval) return;
    const threadId = approval.threadId;
    setApproval(null);
    setThreadPreview(null);
    try {
      const res = await fetch(getApiUrl("/chat/approve"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, approved }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: approved ? (data.result?.user_message || "✅ Done.") : "Action cancelled.", id: Date.now().toString() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error processing approval.", id: `err2-${Date.now()}`, isError: true }]);
    } finally {
      void refreshRuntime();
    }
  };

  const startNewChat = () => {
    setMessages([]); setConversationId(null); setApproval(null); setThreadPreview(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden", position: "relative" }}>
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <button
        onClick={() => setMobileSidebarOpen(v => !v)}
        style={{ display: "none", position: "fixed", top: 12, left: 12, zIndex: 50, width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "var(--shadow-sm)" }}
        className="mobile-menu-btn"
        aria-label="Toggle sidebar"
      >
        {mobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      <Sidebar
        open={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        conversations={conversations}
        onNewChat={startNewChat}
        onSelectChat={id => setConversationId(id)}
        onToggle={() => setSidebarOpen(v => !v)}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onPromptSelect={p => handleSubmit(p)}
        capabilities={{ canRead, canDraft, canWrite }}
      />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "18px 20px 0", display: "grid", gap: 12 }}>
          <SystemStatusBar health={health} config={configStatus} offline={runtimeOffline} />
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 12 }} className="runtime-grid">
            <SystemStatusPanel health={health} config={configStatus} offline={runtimeOffline} onRefresh={refreshRuntime} />
            <SetupChecklist config={configStatus} health={health} offline={runtimeOffline} />
          </div>
        </div>

        <ChatArea
          messages={messages}
          input={input}
          isStreaming={isStreaming}
          onInputChange={setInput}
          onSubmit={() => handleSubmit()}
          onStop={() => abortRef.current?.abort()}
          sidebarOpen={sidebarOpen}
        />
      </main>

      {approval && (
        <ApprovalModal
          approval={approval}
          threadPreview={threadPreview}
          onApprove={() => handleApproval(true)}
          onReject={() => handleApproval(false)}
          onEdit={(text) => {
            setApproval(prev => prev ? { ...prev, plan: { ...prev.plan, parameters: { ...prev.plan.parameters, text } } } : prev);
          }}
        />
      )}
    </div>
  );
}
