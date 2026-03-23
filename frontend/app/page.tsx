"use client";
import { useState, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import ApprovalModal from "./components/ApprovalModal";
import { Message, ApprovalData, ConversationMeta } from "./components/types";
import { Menu, X } from "lucide-react";

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
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isStreaming) return;
    setInput("");
    setMobileSidebarOpen(false);

    const userMessage: Message = { role: "user", content: msg, id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setMessages(prev => [...prev, { role: "assistant", content: "", id: "thinking", isThinking: true }]);
    setIsStreaming(true);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversation_id: conversationId, user_id: "adzry" }),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const data = JSON.parse(line.replace("data: ", ""));
          if (data.thread_id && !conversationId) setConversationId(data.thread_id);

          if (data.type === "reasoning") {
            assistantContent = `🧠 **Analyzing:** ${data.intent}`;
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: assistantContent, isThinking: false } : m));
          } else if (data.type === "thread_draft") {
            setThreadPreview(data.tweets);
          } else if (data.type === "approval_required") {
            setApproval({ threadId: data.thread_id, plan: data.plan, threadDraft: data.thread_draft });
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: `⏳ **Waiting for approval** — ${data.plan?.intent || "action pending"}`, isThinking: false, id: Date.now().toString() } : m));
            setIsStreaming(false);
            return;
          } else if (data.type === "result") {
            assistantContent = data.message;
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: assistantContent, isThinking: false, id: Date.now().toString() } : m));
          } else if (data.type === "error") {
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: `❌ ${data.message}`, isThinking: false, isError: true, id: Date.now().toString() } : m));
          } else if (data.type === "rejected") {
            setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: "Action cancelled.", isThinking: false, id: Date.now().toString() } : m));
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => prev.map(m => m.id === "thinking" ? { ...m, content: "Connection error. Is the backend running?", isThinking: false, isError: true, id: "err" } : m));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!approval) return;
    const threadId = approval.threadId;
    setApproval(null);
    setThreadPreview(null);
    try {
      const res = await fetch("http://localhost:8000/chat/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, approved }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: approved ? (data.result?.user_message || "✅ Done.") : "Action cancelled.", id: Date.now().toString() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error processing approval.", id: "err2", isError: true }]);
    }
  };

  const startNewChat = () => {
    setMessages([]); setConversationId(null); setApproval(null); setThreadPreview(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden", position: "relative" }}>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} style={{ display: "none" }} />
      )}

      {/* Mobile hamburger */}
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
      />

      <ChatArea
        messages={messages}
        input={input}
        isStreaming={isStreaming}
        onInputChange={setInput}
        onSubmit={() => handleSubmit()}
        onStop={() => abortRef.current?.abort()}
        sidebarOpen={sidebarOpen}
      />

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
