import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMetaWebhookSignature({
  body,
  signatureHeader,
  appSecret,
}: {
  body: string;
  signatureHeader: string | null;
  appSecret: string;
}) {
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const supplied = signatureHeader.slice("sha256=".length);
  const expected = createHmac("sha256", appSecret).update(body).digest("hex");
  const suppliedBuffer = Buffer.from(supplied, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}
