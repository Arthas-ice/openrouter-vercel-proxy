import { env } from "@/lib/env";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type ChatPayload = {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

export async function callOpenRouter(payload: ChatPayload) {
  const res = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: payload.model || env.DEFAULT_MODEL,
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens,
      stream: payload.stream ?? false,
    }),
    cache: "no-store",
  });
  return res;
}

export async function listModels() {
  const res = await fetch(`${env.OPENROUTER_BASE_URL}/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": env.OPENROUTER_SITE_URL,
      "X-OpenRouter-Title": env.OPENROUTER_APP_NAME,
    },
    cache: "no-store",
  });

  return res;
}
