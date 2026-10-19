import { describe, expect, it } from "vitest";

import {
  canApprovePayment,
  canRejectPayment,
  validateProofFile,
} from "@/modules/payments/logic";

describe("payment logic", () => {
  it("allows approval only for reviewable proof states", () => {
    expect(canApprovePayment("PROOF_RECEIVED")).toBe(true);
    expect(canApprovePayment("UNDER_REVIEW")).toBe(true);
    expect(canApprovePayment("VERIFIED")).toBe(false);
  });

  it("requires valid proof mime types", () => {
    expect(validateProofFile({ mimeType: "image/png", size: 1024 }).valid).toBe(true);
    expect(validateProofFile({ mimeType: "text/plain", size: 1024 }).valid).toBe(false);
  });

  it("allows rejecting only reviewable payments", () => {
    expect(canRejectPayment("PROOF_RECEIVED")).toBe(true);
    expect(canRejectPayment("AWAITING_PAYMENT")).toBe(false);
  });
});
