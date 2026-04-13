import { z } from "zod";
import { callOpenRouter, extractApiKey } from "@/lib/openrouter";
import { corsHeaders, isDeniedOrigin } from "@/lib/security";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    model: z.string().optional(),
  })
  .passthrough();

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
    if (isDeniedOrigin(origin)) {
      return Response.json(
        { ok: false, error: "Origin is denied." },
        {
          status: 403,
          headers: corsHeaders(origin),
        },
      );
    }

    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return Response.json(
        {
          ok: false,
          error:
            "Missing API key. Pass it in x-openrouter-api-key or Authorization: Bearer <key>.",
        },
        {
          status: 401,
          headers: corsHeaders(origin),
        },
      );
    }

    const json = await req.json();
    const body = bodySchema.parse(json);

    const upstreamBody = {
      ...body,
      model: body.model || env.DEFAULT_MODEL,
    };

    const upstream = await callOpenRouter(req, "responses", upstreamBody);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(origin),
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
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
      },
    );
  }
}
