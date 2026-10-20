import { describe, expect, it } from "vitest";

import { checkoutSchema } from "@/modules/store/schemas";

describe("checkout schema", () => {
  const valid = { productId: "product-1", paymentMethodId: "method-1", acceptTerms: "on" };

  it("requires explicit terms acceptance", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...valid, acceptTerms: undefined }).success).toBe(false);
  });
});
