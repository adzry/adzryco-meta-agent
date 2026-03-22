"use client";
import { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import ApprovalModal from "./components/ApprovalModal";
import ThreadPreview from "./components/ThreadPreview";
import { Message, ApprovalData, ConversationMeta } from "./components/types";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [approval, setApproval] = useState<ApprovalData | null>(null);
  const [threadPreview, setThreadPreview] = useState<string[] | null>(null);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isStreaming) return;
    setInput("");

    const userMessage: Message = { role: "user", content: msg, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);

    const thinkingMessage: Message = {
      role: "assistant", content: "", id: "thinking", isThinking: true,
    };
    setMessages((prev) => [...prev, thinkingMessage]);
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
      let newConvId = conversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = JSON.parse(line.replace("data: ", ""));

          if (data.thread_id && !newConvId) {
            newConvId = data.thread_id;
            setConversationId(data.thread_id);
          }

          if (data.type === "thinking") {
            // already shown
          } else if (data.type === "reasoning") {
            assistantContent = `🧠 **Analyzing:** ${data.intent}`;
            setMessages((prev) => prev.map((m) =>
              m.id === "thinking" ? { ...m, content: assistantContent, isThinking: false } : m
            ));
          } else if (data.type === "thread_draft") {
            setThreadPreview(data.tweets);
          } else if (data.type === "approval_required") {
            setApproval({ threadId: data.thread_id, plan: data.plan, threadDraft: data.thread_draft });
            assistantContent = `⏳ **Waiting for your approval** — ${data.plan?.intent || "action pending"}`;
            setMessages((prev) => prev.map((m) =>
              m.id === "thinking" ? { ...m, content: assistantContent, isThinking: false, id: Date.now().toString() } : m
            ));
            setIsStreaming(false);
            return;
          } else if (data.type === "result") {
            assistantContent = data.message;
            setMessages((prev) => prev.map((m) =>
              m.id === "thinking" ? { ...m, content: assistantContent, isThinking: false, id: Date.now().toString() } : m
            ));
          } else if (data.type === "error") {
            assistantContent = `❌ ${data.message}`;
            setMessages((prev) => prev.map((m) =>
              m.id === "thinking" ? { ...m, content: assistantContent, isThinking: false, isError: true, id: Date.now().toString() } : m
            ));
          } else if (data.type === "rejected") {
            assistantContent = "Action cancelled. What else can I help you with?";
            setMessages((prev) => prev.map((m) =>
              m.id === "thinking" ? { ...m, content: assistantContent, isThinking: false, id: Date.now().toString() } : m
            ));
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) => prev.map((m) =>
          m.id === "thinking" ? { ...m, content: "Connection error. Is the backend running?", isThinking: false, isError: true, id: "err" } : m
        ));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!approval) return;
    setApproval(null);
    setThreadPreview(null);
    try {
      const res = await fetch("http://localhost:8000/chat/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: approval.threadId, approved }),
      });
      const data = await res.json();
      const msg = approved
        ? (data.result?.user_message || "✅ Action completed successfully.")
        : "Action cancelled.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg, id: Date.now().toString() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error processing approval.", id: "err2", isError: true }]);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setApproval(null);
    setThreadPreview(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        onNewChat={startNewChat}
        onSelectChat={(id) => setConversationId(id)}
        onToggle={() => setSidebarOpen((v) => !v)}
        onPromptSelect={(p) => handleSubmit(p)}
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
        />
      )}
    </div>
  );
}
