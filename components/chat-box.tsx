"use client";

import { FormEvent, useMemo, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ChatBox() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("x-ai/grok-4.20");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => {
    return input.trim().length > 0 && apiKey.trim().length > 0 && !loading;
  }, [input, apiKey, loading]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    const userText = input.trim();
    setInput("");
    setLoading(true);

    const nextMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(nextMessages);

    try {
      const res = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openrouter-api-key": apiKey.trim(),
        },
        body: JSON.stringify({
          model,
          stream: false,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data?.error || `HTTP ${res.status}`;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${errMsg}` },
        ]);
        return;
      }

      const reply = data?.choices?.[0]?.message?.content ?? "No response";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 24,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20,
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <h1 style={{ marginTop: 0 }}>OpenRouter Proxy Demo</h1>
      <p style={{ opacity: 0.8 }}>
        前端请求你自己的 Vercel API，并在请求头中携带用户自己的 OpenRouter Key。
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8 }}>OpenRouter API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-v1-..."
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "#121a30",
            color: "white",
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Model</label>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "#121a30",
            color: "white",
          }}
        />
      </div>

      <div
        style={{
          minHeight: 320,
          padding: 16,
          borderRadius: 16,
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 16,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ opacity: 0.6 }}>还没有消息，先发一句试试。</div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 14,
                background: m.role === "user" ? "#1d4ed8" : "#1f2937",
                whiteSpace: "pre-wrap",
              }}
            >
              <strong>{m.role === "user" ? "User" : "Assistant"}</strong>
              <div style={{ marginTop: 8 }}>{m.content}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入消息"
          rows={5}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "#121a30",
            color: "white",
            resize: "vertical",
          }}
        />
        <button
          type="submit"
          disabled={!canSend}
          style={{
            marginTop: 12,
            padding: "12px 18px",
            borderRadius: 999,
            border: "none",
            background: canSend ? "white" : "#666",
            color: "black",
            cursor: canSend ? "pointer" : "not-allowed",
            fontWeight: 700,
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}