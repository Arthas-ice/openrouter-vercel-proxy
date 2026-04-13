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

function isValidResponsesTool(tool: Record<string, unknown>) {
  if (tool.type === "openrouter:datetime") return true;
  if (tool.type === "openrouter:web_search") return true;

  return (
    tool.type === "function" &&
    typeof tool.name === "string" &&
    !!tool.parameters &&
    typeof tool.parameters === "object"
  );
}

function normalizeResponsesBody(input: Record<string, unknown>) {
  const body = { ...input };

  if (Array.isArray(body.tools)) {
    body.tools = body.tools
      .filter(Boolean)
      .map((tool) => {
        if (!tool || typeof tool !== "object") return null;

        const t = tool as Record<string, unknown>;

        if (
          t.type === "function" &&
          t.function &&
          typeof t.function === "object"
        ) {
          const fn = t.function as Record<string, unknown>;
          const { function: _ignored, ...rest } = t;

          return {
            ...rest,
            type: "function",
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters,
            ...(fn.strict !== undefined ? { strict: fn.strict } : {}),
          };
        }

        return t;
      })
      .filter((tool): tool is Record<string, unknown> => {
        if (!tool) return false;
        const ok = isValidResponsesTool(tool);
        if (!ok) {
          console.warn("Dropping invalid responses tool:", tool);
        }
        return ok;
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
