import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_API_URL = "https://estoque-lima-api.onrender.com/api/v1";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function buildBackendUrl(pathParts: string[], request: NextRequest) {
  const path = pathParts.join("/");
  const search = request.nextUrl.search || "";

  return `${BACKEND_API_URL}/${path}${search}`;
}

function buildForwardHeaders(request: NextRequest) {
  const headers = new Headers();

  const allowedHeaders = [
    "accept",
    "authorization",
    "content-type",
    "cookie",
    "x-csrf-token",
    "x-requested-with",
    "user-agent",
  ];

  for (const headerName of allowedHeaders) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  headers.set("x-forwarded-host", request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  return headers;
}

function copyResponseHeaders(backendResponse: Response) {
  const headers = new Headers();

  const blockedHeaders = new Set([
    "connection",
    "content-encoding",
    "content-length",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
  ]);

  backendResponse.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    if (!blockedHeaders.has(lowerKey) && lowerKey !== "set-cookie") {
      headers.set(key, value);
    }
  });

  const responseHeaders = backendResponse.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof responseHeaders.getSetCookie === "function") {
    const cookies = responseHeaders.getSetCookie();

    for (const cookie of cookies) {
      headers.append("set-cookie", cookie);
    }
  } else {
    const cookie = backendResponse.headers.get("set-cookie");

    if (cookie) {
      headers.append("set-cookie", cookie);
    }
  }

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;

  const backendUrl = buildBackendUrl(path, request);
  const method = request.method.toUpperCase();

  const hasBody = !["GET", "HEAD"].includes(method);

  const backendResponse = await fetch(backendUrl, {
    method,
    headers: buildForwardHeaders(request),
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  const headers = copyResponseHeaders(backendResponse);

  if (backendResponse.status === 204 || method === "HEAD") {
    return new NextResponse(null, {
      status: backendResponse.status,
      headers,
    });
  }

  const body = await backendResponse.arrayBuffer();

  return new NextResponse(body, {
    status: backendResponse.status,
    headers,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
  });
}