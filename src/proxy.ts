import { NextResponse, type NextRequest } from "next/server";

import {
  checkDistributedRateLimit,
  checkRateLimit,
  type RateLimitRule,
} from "@/server/security/rate-limit";
import { applySecurityHeaders } from "@/server/security/headers";

const sensitiveRouteRules: Array<{ pattern: RegExp; rule: RateLimitRule }> = [
  { pattern: /^\/api\/auth/, rule: { windowMs: 60_000, maxRequests: 20 } },
  {
    pattern: /^\/api\/mock\/whatsapp\/incoming$/,
    rule: { windowMs: 60_000, maxRequests: 30 },
  },
  {
    pattern: /^\/api\/webhooks\/whatsapp$/,
    rule: { windowMs: 60_000, maxRequests: 120 },
  },
  {
    pattern: /^\/api\/conversations\/[^/]+\/(messages|takeover)$/,
    rule: { windowMs: 60_000, maxRequests: 60 },
  },
  {
    pattern: /^\/api\/project-inquiries$/,
    rule: { windowMs: 60_000, maxRequests: 5 },
  },
  {
    pattern: /^\/api\/newsletter$/,
    rule: { windowMs: 60_000, maxRequests: 10 },
  },
];

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  return forwardedFor || realIp || "unknown";
}

function getRateLimitRule(pathname: string) {
  return sensitiveRouteRules.find(({ pattern }) => pattern.test(pathname))?.rule;
}

export async function proxy(request: NextRequest) {
  const rule = getRateLimitRule(request.nextUrl.pathname);
  let remaining: number | undefined;

  if (rule && request.method !== "GET") {
    const key = `${request.nextUrl.pathname}:${getClientKey(request)}`;
    let result;

    try {
      result = await checkDistributedRateLimit({ key, rule });
    } catch {
      if (process.env.NODE_ENV === "production") {
        const response = NextResponse.json(
          { error: "Request protection is temporarily unavailable." },
          { status: 503 },
        );
        response.headers.set("Retry-After", "5");
        applySecurityHeaders(response.headers);
        return response;
      }

      result = checkRateLimit({ key, rule });
    }

    remaining = result.remaining;

    if (!result.allowed) {
      const response = NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 },
      );
      response.headers.set(
        "Retry-After",
        `${Math.ceil((result.resetAt - Date.now()) / 1000)}`,
      );
      applySecurityHeaders(response.headers);
      return response;
    }
  }

  const response = NextResponse.next();
  if (remaining !== undefined) {
    response.headers.set("X-RateLimit-Remaining", String(remaining));
  }
  applySecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
