import { describe, expect, it } from "vitest";

import { sendWhatsAppText } from "@/modules/whatsapp/client";

describe("WhatsApp transport", () => {
  it("returns a synthetic provider id in mock mode", async () => {
    const result = await sendWhatsAppText("923001234567", "Hello");

    expect(result.providerMessageId).toMatch(/^mock-/);
    expect(result.rawResponse).toEqual({ mock: true });
  });
});
