import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "ppds_customer_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

type SessionPayload = { accountId: string; expiresAt: number };

function signature(payload: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(body)}`;
}

function decode(value: string): SessionPayload | null {
  const [body, providedSignature] = value.split(".");
  if (!body || !providedSignature) return null;
  const expected = signature(body);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(providedSignature);
  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    return payload.accountId && payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export async function createCustomerSession(accountId: string) {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  (await cookies()).set(COOKIE_NAME, encode({ accountId, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function deleteCustomerSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getCustomerAccount() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const payload = token ? decode(token) : null;
  if (!payload) return null;

  return prisma.customerAccount.findFirst({
    where: { id: payload.accountId, isActive: true },
    include: { customer: true, business: true },
  });
}

export async function requireCustomerAccount(next = "/account") {
  const account = await getCustomerAccount();
  if (!account) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return account;
}
