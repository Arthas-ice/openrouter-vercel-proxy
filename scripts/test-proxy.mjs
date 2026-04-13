#!/usr/bin/env node

const BASE_URL = process.env.PROXY_BASE_URL || "https://your-app.vercel.app";
const PATHNAME = process.env.PROXY_PATH || "/api/chat";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "sk-";
// 如果你已经做成了通用代理，也可以改成：/api/proxy/chat/completions

async function testNonStream() {
  console.log(`\n[non-stream] POST ${BASE_URL}${PATHNAME}`);
  console.log("key", OPENROUTER_API_KEY);
  const res = await fetch(`${BASE_URL}${PATHNAME}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      stream: false,
      messages: [
        {
          role: "user",
          content: "Reply with: proxy non-stream ok",
        },
      ],
    }),
  });

  console.log("status:", res.status);
  console.log("content-type:", res.headers.get("content-type"));
  console.log("acao:", res.headers.get("access-control-allow-origin"));

  const text = await res.text();
  console.log("body:", text);
}

async function testStream() {
  console.log(`\n[stream] POST ${BASE_URL}${PATHNAME}`);

  const res = await fetch(`${BASE_URL}${PATHNAME}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:4000",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "user",
          content: "Reply with a short sentence about streaming test.",
        },
      ],
    }),
  });

  console.log("status:", res.status);
  console.log("content-type:", res.headers.get("content-type"));
  console.log("acao:", res.headers.get("access-control-allow-origin"));

  if (!res.body) {
    console.log("No response body stream.");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  console.log("stream chunks:");
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(decoder.decode(value, { stream: true }));
  }
  process.stdout.write("\n");
}

async function main() {
  try {
    await testNonStream();
    await testStream();
  } catch (err) {
    console.error("test failed:", err);
    process.exit(1);
  }
}

main();
