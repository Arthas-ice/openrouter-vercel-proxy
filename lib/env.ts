function splitCsv(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  OPENROUTER_BASE_URL:
    process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1",

  OPENROUTER_APP_NAME:
    process.env.OPENROUTER_APP_NAME?.trim() || "OpenRouter Vercel Proxy",

  OPENROUTER_SITE_URL:
    process.env.OPENROUTER_SITE_URL?.trim() || "http://localhost:3000",

  DENY_ORIGINS: splitCsv(process.env.DENY_ORIGINS),
  DENY_HOSTS: splitCsv(process.env.DENY_HOSTS),
  DENY_LOCALHOST: (process.env.DENY_LOCALHOST?.trim() || "false") === "true",

  DEFAULT_MODEL: process.env.DEFAULT_MODEL?.trim() || "openai/gpt-4o-mini",
};
