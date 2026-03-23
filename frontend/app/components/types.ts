export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isThinking?: boolean;
  isError?: boolean;
}

export interface ApprovalData {
  threadId: string;
  plan: {
    action: string;
    parameters: Record<string, any>;
    intent: string;
    requires_approval: boolean;
  };
  threadDraft: string[];
}

export interface ConversationMeta {
  id: string;
  title: string;
  updated_at: string;
}

export interface PromptTemplate {
  label: string;
  prompt: string;
  capability: "read" | "draft" | "write";
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  { label: "Search trending topics", prompt: "Search for 10 recent tweets about AI automation", capability: "read" },
  { label: "Get my profile", prompt: "Get user AdzryCo", capability: "read" },
  { label: "Draft a thread", prompt: "Generate a 5-tweet thread about why n8n is the best automation platform", capability: "draft" },
  { label: "Post announcement", prompt: "Create a tweet: Just shipped something new. Stay tuned. 🚀", capability: "write" },
  { label: "Analyze account", prompt: "Get analytics for my account", capability: "read" },
  { label: "Find leads", prompt: "Search for 10 tweets about (automation OR n8n) from founders -is:retweet", capability: "read" },
];
