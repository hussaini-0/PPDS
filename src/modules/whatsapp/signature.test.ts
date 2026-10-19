import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyMetaWebhookSignature } from "@/modules/whatsapp/signature";

describe("Meta webhook signature verification", () => {
  it("accepts a valid signature", () => {
    const body = JSON.stringify({ event: "message" });
    const secret = "test-secret";
    const digest = createHmac("sha256", secret).update(body).digest("hex");

    expect(
      verifyMetaWebhookSignature({
        body,
        appSecret: secret,
        signatureHeader: `sha256=${digest}`,
      }),
    ).toBe(true);
  });

  it("rejects a missing or invalid signature", () => {
    expect(
      verifyMetaWebhookSignature({
        body: "{}",
        appSecret: "test-secret",
        signatureHeader: "sha256=bad",
      }),
    ).toBe(false);
  });
});
