import { NextResponse } from "next/server";

import { getHealthStatus } from "@/server/health/service";

export async function GET() {
  const payload = await getHealthStatus();
  const status = payload.status === "ok" ? 200 : 503;

  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
