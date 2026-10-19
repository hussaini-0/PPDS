import { describe, expect, it } from "vitest";

import { validateOutboundMessageWindow } from "@/modules/whatsapp/service-window";

describe("service window validation", () => {
  it("blocks free-form messaging outside the open service window", () => {
    const result = validateOutboundMessageWindow({
      serviceWindowExpiresAt: new Date(Date.now() - 10_000),
      isTemplateMessage: false,
    });

    expect(result.allowed).toBe(false);
  });

  it("allows template messaging outside the open service window", () => {
    const result = validateOutboundMessageWindow({
      serviceWindowExpiresAt: null,
      isTemplateMessage: true,
    });

    expect(result.allowed).toBe(true);
  });
});
