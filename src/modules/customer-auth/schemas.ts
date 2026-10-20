import { z } from "zod";

const password = z.string().min(10, "Use at least 10 characters.").max(128);

export const customerLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required."),
  next: z.string().optional(),
});

export const customerRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    phoneNumber: z.string().trim().min(8).max(24),
    password,
    confirmPassword: z.string(),
    next: z.string().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function safeCustomerRedirect(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}
