import { z } from "zod";
import { callOpenRouter } from "@/lib/openrouter";
import { corsHeaders, isAllowedOrigin } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string().min(1),
});

const bodySchema = z.object({
  model: z.string().optional(),
  messages: z.array(messageSchema).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional().default(false),
});

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
export async function POST(req: Request) {
  const origin = req.headers.get("origin");

  try {
    const json = await req.json();
    const body = bodySchema.parse(json);

    const upstream = await callOpenRouter({
      model: body.model,
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      stream: false,
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return Response.json(
      { ok: false, error: message },
      {
        status: 400,
        headers: corsHeaders(origin),
      }
    );
  }
}