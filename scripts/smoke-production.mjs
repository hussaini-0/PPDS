const baseUrl = process.env.APP_URL?.replace(/\/$/, "");
if (!baseUrl?.startsWith("https://")) {
  throw new Error("APP_URL must be an HTTPS production URL.");
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: options.redirect ?? "follow",
    signal: AbortSignal.timeout(15_000),
    ...options,
  });
  return response;
}

const health = await request("/api/health");
if (!health.ok) throw new Error(`Health check failed with HTTP ${health.status}.`);
const healthBody = await health.json();
if (healthBody.status !== "ok") throw new Error("Health response is not healthy.");

for (const path of ["/", "/products", "/software-development", "/project-request", "/login"]) {
  const response = await request(path);
  if (!response.ok) throw new Error(`${path} failed with HTTP ${response.status}.`);
}

const protectedPage = await request("/dashboard/cms");
if (!protectedPage.ok || new URL(protectedPage.url).pathname !== "/login") {
  throw new Error("Unauthenticated CMS access did not redirect to /login.");
}

const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
if (!verifyToken) throw new Error("WHATSAPP_VERIFY_TOKEN is required for smoke testing.");
const challenge = `ppds-smoke-${Date.now()}`;
const webhook = await request(
  `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=${challenge}`,
);
if (!webhook.ok || (await webhook.text()) !== challenge) {
  throw new Error("WhatsApp webhook verification handshake failed.");
}

console.log("Production smoke checks passed: health, public pages, CMS auth, and WhatsApp verification.");
