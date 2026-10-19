"use server";

import AuthError from "next-auth";

import { signIn } from "@/modules/auth/auth";
import { loginSchema } from "@/modules/auth/schemas";

export async function loginAction(_prevState: string | null, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return "Enter a valid email and password.";
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Authentication failed. Check the seeded credentials and try again.";
    }

    throw error;
  }

  return null;
}
