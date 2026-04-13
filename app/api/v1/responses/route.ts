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

function normalizeResponsesBody(input: Record<string, unknown>) {
  const body = { ...input };

  if (Array.isArray(body.tools)) {
    body.tools = body.tools.filter(Boolean).map((tool) => {
      if (!tool || typeof tool !== "object") return tool;

      const t = tool as Record<string, unknown>;

      if (
        t.type === "function" &&
        t.function &&
        typeof t.function === "object"
      ) {
        return t;
      }

      if (
        (t.type === "function" || "name" in t || "parameters" in t) &&
        !t.function
      ) {
        const { name, description, parameters, strict, ...rest } = t;

        return {
          ...rest,
          type: "function",
          function: {
            name,
            description,
            parameters,
            ...(strict !== undefined ? { strict } : {}),
          },
        };
      }

      return t;
    });
  }

  return body;
}

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
        { status: 403, headers: corsHeaders(origin) },
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
        { status: 401, headers: corsHeaders(origin) },
      );
    }

    const json = await req.json();
    const parsed = bodySchema.parse(json);
    console.log("request", parsed);
    const upstreamBody = normalizeResponsesBody({
      ...parsed,
      model: parsed.model || env.DEFAULT_MODEL,
    });

    console.log(
      "normalized responses tools:",
      JSON.stringify((upstreamBody as any).tools ?? null, null, 2),
    );

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
