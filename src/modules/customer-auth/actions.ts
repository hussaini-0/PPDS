"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getPublicBusiness } from "@/modules/cms/service";
import { customerLoginSchema, customerRegistrationSchema, safeCustomerRedirect } from "@/modules/customer-auth/schemas";
import { createCustomerSession, deleteCustomerSession } from "@/modules/customer-auth/session";

export type CustomerAuthState = { error?: string } | null;

export async function customerLoginAction(_state: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  const parsed = customerLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const business = await getPublicBusiness();
  const account = await prisma.customerAccount.findUnique({
    where: { businessId_email: { businessId: business.id, email: parsed.data.email } },
  });
  if (!account?.isActive || !(await bcrypt.compare(parsed.data.password, account.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }

  await createCustomerSession(account.id);
  redirect(safeCustomerRedirect(parsed.data.next));
}

export async function customerRegisterAction(_state: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  const parsed = customerRegistrationSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const normalizedPhoneNumber = normalizePhoneNumber(parsed.data.phoneNumber);
  if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhoneNumber)) {
    return { error: "Use a valid international phone number, for example +923001234567." };
  }

  const business = await getPublicBusiness();
  const existingAccount = await prisma.customerAccount.findUnique({
    where: { businessId_email: { businessId: business.id, email: parsed.data.email } },
  });
  if (existingAccount) return { error: "An account already exists for this email." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const account = await prisma.$transaction(async (tx) => {
    const existingCustomer = await tx.customer.findUnique({
      where: { businessId_normalizedPhoneNumber: { businessId: business.id, normalizedPhoneNumber } },
      include: { account: true },
    });
    if (existingCustomer?.account) throw new Error("This phone number already belongs to a customer account.");

    const customer = existingCustomer
      ? await tx.customer.update({
          where: { id: existingCustomer.id },
          data: { fullName: parsed.data.fullName, email: parsed.data.email, phoneNumber: parsed.data.phoneNumber },
        })
      : await tx.customer.create({
          data: {
            businessId: business.id,
            fullName: parsed.data.fullName,
            email: parsed.data.email,
            phoneNumber: parsed.data.phoneNumber,
            normalizedPhoneNumber,
            tags: ["website-customer"],
            source: "website",
          },
        });

    return tx.customerAccount.create({
      data: { businessId: business.id, customerId: customer.id, email: parsed.data.email, passwordHash },
    });
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message.includes("phone number")) return null;
    throw error;
  });

  if (!account) return { error: "This phone number already belongs to a customer account." };
  await createCustomerSession(account.id);
  redirect(safeCustomerRedirect(parsed.data.next));
}

export async function customerLogoutAction() {
  await deleteCustomerSession();
  redirect("/");
}
