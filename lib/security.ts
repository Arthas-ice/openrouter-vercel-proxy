import { env } from "@/lib/env";

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase();
}

function isLoopbackHostname(hostname: string): boolean {
  const h = normalizeHostname(hostname);
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
}

function safeParseOrigin(origin: string | null): URL | null {
  if (!origin) return null;
  try {
    return new URL(origin);
  } catch {
    return null;
  }
}

export function isDeniedOrigin(origin: string | null): boolean {
  const url = safeParseOrigin(origin);
  if (!url) return false;

  if (env.DENY_ORIGINS.includes(url.origin)) {
    return true;
  }

  if (env.DENY_LOCALHOST && isLoopbackHostname(url.hostname)) {
    return true;
  }

  const hostname = normalizeHostname(url.hostname);
  if (env.DENY_HOSTS.map(normalizeHostname).includes(hostname)) {
    return true;
  }

  return false;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-openrouter-api-key, x-api-key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  // 不再做 allow 白名单。只要不是黑名单，就回显 origin
  if (origin && !isDeniedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}