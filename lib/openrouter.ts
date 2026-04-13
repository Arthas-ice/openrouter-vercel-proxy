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

export function extractApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization")?.trim();
  const directKey = req.headers.get("x-openrouter-api-key")?.trim();
  const xApiKey = req.headers.get("x-api-key")?.trim();

  if (directKey) return directKey;
  if (xApiKey) return xApiKey;

  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  return null;
}

export async function callOpenRouter(
  req: Request,
  path: string,
  body: unknown,
  init?: {
    method?: string;
  },
) {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    throw new Error(
      "Missing API key. Pass it in x-openrouter-api-key or Authorization: Bearer <key>.",
    );
  }

  const cleanBase = env.OPENROUTER_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  const url = `${cleanBase}/${cleanPath}`;

  const method = init?.method ?? "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": env.OPENROUTER_SITE_URL,
      "X-OpenRouter-Title": env.OPENROUTER_APP_NAME,
    },
    body: body == null ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  return res;
}
