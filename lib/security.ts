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

export function isAllowedOrigin(origin: string | null): boolean {
  const url = safeParseOrigin(origin);
  if (!url) return false;

  // 1) 精确 origin 白名单
  if (env.ALLOWED_ORIGINS.includes(url.origin)) {
    return true;
  }

  // 2) localhost / 127.0.0.1 / ::1 放行（任意端口）
  if (env.ALLOW_LOCALHOST && isLoopbackHostname(url.hostname)) {
    return true;
  }

  // 3) 指定 host 白名单，忽略端口
  const hostname = normalizeHostname(url.hostname);
  if (env.ALLOWED_HOSTS.map(normalizeHostname).includes(hostname)) {
    return true;
  }

  return false;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (isAllowedOrigin(origin) && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}
