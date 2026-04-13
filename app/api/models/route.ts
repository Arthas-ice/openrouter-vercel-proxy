import { corsHeaders, isAllowedOrigin } from "@/lib/security";
import { listModels } from "@/lib/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin");

  if (!isAllowedOrigin(origin)) {
    return Response.json(
      { ok: false, error: "origin not allowed" },
      {
        status: 403,
        headers: corsHeaders(origin),
      }
    );
  }

  const upstream = await listModels();
  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": upstream.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}
