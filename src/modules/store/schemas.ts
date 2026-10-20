import { z } from "zod";

export const checkoutSchema = z.object({
  productId: z.string().min(1),
  paymentMethodId: z.string().min(1, "Select a payment method."),
  referenceNumber: z.string().trim().max(120).optional(),
  acceptTerms: z.literal("on", { error: "You must accept the Terms of Service." }),
});

export const fulfillmentSchema = z
  .object({
    orderId: z.string().min(1),
    login: z.string().trim().max(300).optional(),
    password: z.string().max(300).optional(),
    accessUrl: z.string().trim().url().optional().or(z.literal("")),
    licenseKey: z.string().trim().max(500).optional(),
    instructions: z.string().trim().max(3000).optional(),
    expiresAt: z.string().optional(),
  })
  .refine((value) => value.login || value.password || value.accessUrl || value.licenseKey, {
    message: "Add at least one credential field.",
  });

export const paymentMethodSchema = z.object({
  name: z.string().trim().min(2).max(80),
  instructions: z.string().trim().min(10).max(2000),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
