import { describe, expect, it } from "vitest";

import { checkoutSchema, walletAdjustmentSchema, walletCheckoutSchema } from "@/modules/store/schemas";

describe("checkout schema", () => {
  const valid = { productId: "product-1", paymentMethodId: "method-1", acceptTerms: "on" };

  it("requires explicit terms acceptance", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...valid, acceptTerms: undefined }).success).toBe(false);
  });
});

describe("wallet schemas", () => {
  it("requires terms acceptance for wallet checkout", () => {
    expect(walletCheckoutSchema.safeParse({ productId: "product-1", acceptTerms: "on" }).success).toBe(true);
    expect(walletCheckoutSchema.safeParse({ productId: "product-1" }).success).toBe(false);
  });

  it("rejects non-positive adjustments and missing audit reasons", () => {
    const valid = { customerAccountId: "account-1", direction: "CREDIT", amount: 500, reason: "Bank transfer received" };
    expect(walletAdjustmentSchema.safeParse(valid).success).toBe(true);
    expect(walletAdjustmentSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    expect(walletAdjustmentSchema.safeParse({ ...valid, reason: "cash" }).success).toBe(false);
  });
});
