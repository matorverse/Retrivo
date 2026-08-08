"use client";

import { useState } from "react";
import { Send, Bot, User, BookOpen, FileText, Sparkles, RefreshCw, AlertCircle } from "lucide-react";

interface Citation {
  filename: string;
  chunkIndex: number;
  snippet: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
}

interface ChatInterfaceProps {
  documentId?: string;
  documentName?: string;
}

export function ChatInterface({ documentId, documentName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: documentName
        ? `Ask any question about **${documentName}**. I will answer strictly using your notes and provide direct citations.`
        : "Ask any question about your uploaded lecture notes and PDFs. I will retrieve relevant paragraphs and cite source documents.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = input.trim();
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentQuery,
          documentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to get AI response.");
        return;
      }

      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        role: "assistant",
        content: data.answer,
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setError("Network error while connecting to chat service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calm-card flex flex-col h-[600px] max-w-4xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-calm-border bg-calm-surface flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-calm-sm bg-calm-primary-tint text-calm-primary">
            <Bot className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-calm-text">
              {documentName ? `Q&A: ${documentName}` : "AI Study Assistant"}
            </h3>
            <p className="text-xs text-calm-text-muted">
              Cited vector retrieval &bull; Scoped to your notes
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: `reset_${Date.now()}`,
                role: "assistant",
                content: "Chat cleared. Ask a new question about your course material.",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ])
          }
          className="px-2.5 py-1 rounded-calm-sm text-xs text-calm-text-muted hover:text-calm-text hover:bg-calm-surface-muted transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5 stroke-[1.75]" />
          Clear
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-calm-bg">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
          >
            <div
              className={`p-2 rounded-calm-sm h-fit shrink-0 ${
                msg.role === "user"
                  ? "bg-calm-primary text-white"
                  : "bg-calm-surface border border-calm-border text-calm-primary"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 stroke-[1.75]" />
              ) : (
                <Bot className="w-4 h-4 stroke-[1.75]" />
              )}
            </div>

            <div className="space-y-2.5 max-w-2xl">
              <div
                className={`p-4 rounded-calm-lg text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-calm-primary text-white rounded-tr-none"
                    : "bg-calm-surface border border-calm-border text-calm-text rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`text-[10px] mt-2 text-right ${
                    msg.role === "user" ? "text-white/70" : "text-calm-text-subtle"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* Citations list */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="p-3 rounded-calm-sm bg-calm-surface-muted border border-calm-border text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-calm-text-muted font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-calm-primary stroke-[1.75]" />
                    <span>Citations & Source Paragraphs</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.citations.map((cite, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-calm-primary-tint border border-calm-primary/20 text-calm-primary text-[11px] font-medium cursor-help"
                        title={cite.snippet}
                      >
                        <FileText className="w-3 h-3 stroke-[1.75]" />
                        {cite.filename} &bull; Chunk #{cite.chunkIndex}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-calm-text-muted text-xs p-3 bg-calm-surface rounded-calm-sm border border-calm-border w-fit animate-calm-pulse">
            <Sparkles className="w-4 h-4 text-calm-primary stroke-[1.75]" />
            <span>Searching vector embeddings and generating cited answer...</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-calm-sm bg-calm-danger-tint border border-calm-danger/30 text-calm-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-calm-surface border-t border-calm-border flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            documentName
              ? `Ask a question about ${documentName}...`
              : "Ask anything about your uploaded notes..."
          }
          className="flex-1 px-4 py-2.5 rounded-calm-sm bg-calm-bg border border-calm-border text-sm text-calm-text placeholder-calm-text-subtle focus:outline-none focus:border-calm-primary transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-calm-sm bg-calm-primary hover:bg-calm-primary-hover text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4 stroke-[1.75]" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
