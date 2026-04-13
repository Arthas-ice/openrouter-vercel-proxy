function splitCsv(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function required(name: string, value?: string) {
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const env = {
  OPENROUTER_API_KEY: required(
    "OPENROUTER_API_KEY",
    process.env.OPENROUTER_API_KEY,
  ),
  OPENROUTER_BASE_URL:
    process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1",
  OPENROUTER_APP_NAME:
    process.env.OPENROUTER_APP_NAME?.trim() || "OpenRouter Vercel Proxy",
  OPENROUTER_SITE_URL:
    process.env.OPENROUTER_SITE_URL?.trim() || "http://localhost:3000",

  ALLOWED_ORIGINS: splitCsv(process.env.ALLOWED_ORIGINS),
  ALLOWED_HOSTS: splitCsv(process.env.ALLOWED_HOSTS),
  ALLOW_LOCALHOST: (process.env.ALLOW_LOCALHOST?.trim() || "false") === "true",

  DEFAULT_MODEL: process.env.DEFAULT_MODEL?.trim() || "openai/gpt-4o-mini",
};
