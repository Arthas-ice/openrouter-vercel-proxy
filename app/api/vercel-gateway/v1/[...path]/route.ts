import { callVercelGateway } from "@/lib/vercel-gateway";
import { corsHeaders, isDeniedOrigin } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

function responseHeaders(origin: string | null, upstream: Response): Headers {
  const headers = new Headers();

  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const cacheControl = upstream.headers.get("cache-control");
  headers.set("Cache-Control", cacheControl || "no-store");

  const vary = upstream.headers.get("vary");
  if (vary) {
    headers.set("Vary", vary);
  }

  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    headers.set(key, value);
  }

  return headers;
}

async function proxy(req: Request, context: RouteContext) {
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

    const params = await context.params;
    const path = (params.path ?? []).join("/");

    if (!path) {
      return Response.json(
        {
          ok: false,
          error:
            "Missing gateway path. Use /vercel-gateway/v1/chat/completions, /vercel-gateway/v1/models, etc.",
        },
        {
          status: 400,
          headers: corsHeaders(origin),
        },
      );
    }

    const upstream = await callVercelGateway(req, path);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders(origin, upstream),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";

    return Response.json(
      {
        ok: false,
        error: message,
      },
      {
        status: 400,
        headers: corsHeaders(origin),
      },
    );
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");

  if (isDeniedOrigin(origin)) {
    return new Response(null, {
      status: 403,
      headers: corsHeaders(origin),
    });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(req: Request, context: RouteContext) {
  return proxy(req, context);
}

export async function POST(req: Request, context: RouteContext) {
  return proxy(req, context);
}

export async function PUT(req: Request, context: RouteContext) {
  return proxy(req, context);
}

export async function PATCH(req: Request, context: RouteContext) {
  return proxy(req, context);
}

export async function DELETE(req: Request, context: RouteContext) {
  return proxy(req, context);
}
