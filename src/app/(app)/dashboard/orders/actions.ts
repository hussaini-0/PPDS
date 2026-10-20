"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/session";
import { fulfillmentSchema, paymentMethodSchema } from "@/modules/store/schemas";
import { approveStoreOrder, fulfillStoreOrder, rejectStoreOrder } from "@/modules/store/service";

function refresh() {
  revalidatePath("/dashboard/orders");
  revalidatePath("/account");
}

export async function approveStoreOrderAction(formData: FormData) {
  const session = await requirePermission("APPROVE_PAYMENTS");
  await approveStoreOrder({ businessId: session.user.businessId, actorId: session.user.id, orderId: String(formData.get("orderId") ?? "") });
  refresh();
}

export async function rejectStoreOrderAction(formData: FormData) {
  const session = await requirePermission("APPROVE_PAYMENTS");
  await rejectStoreOrder({ businessId: session.user.businessId, actorId: session.user.id, orderId: String(formData.get("orderId") ?? ""), reason: String(formData.get("reason") ?? "") });
  refresh();
}

export async function fulfillStoreOrderAction(formData: FormData) {
  const session = await requirePermission("MANAGE_SUBSCRIPTIONS");
  const parsed = fulfillmentSchema.parse({
    orderId: formData.get("orderId"), login: formData.get("login") || undefined, password: formData.get("password") || undefined,
    accessUrl: formData.get("accessUrl") || undefined, licenseKey: formData.get("licenseKey") || undefined,
    instructions: formData.get("instructions") || undefined, expiresAt: formData.get("expiresAt") || undefined,
  });
  const credential = Object.fromEntries(Object.entries({ login: parsed.login, password: parsed.password, accessUrl: parsed.accessUrl, licenseKey: parsed.licenseKey }).filter((entry): entry is [string, string] => Boolean(entry[1])));
  await fulfillStoreOrder({ businessId: session.user.businessId, actorId: session.user.id, orderId: parsed.orderId, credential, instructions: parsed.instructions, expiresAt: parsed.expiresAt ? new Date(`${parsed.expiresAt}T23:59:59.999Z`) : undefined });
  refresh();
}

export async function createStorePaymentMethodAction(formData: FormData) {
  const session = await requirePermission("MANAGE_CMS");
  const data = paymentMethodSchema.parse({ name: formData.get("name"), instructions: formData.get("instructions"), sortOrder: formData.get("sortOrder") || 0 });
  await prisma.storePaymentMethod.create({ data: { businessId: session.user.businessId, ...data } });
  refresh();
}

export async function toggleStorePaymentMethodAction(formData: FormData) {
  const session = await requirePermission("MANAGE_CMS");
  const id = String(formData.get("id") ?? "");
  const method = await prisma.storePaymentMethod.findFirstOrThrow({ where: { id, businessId: session.user.businessId } });
  await prisma.storePaymentMethod.update({ where: { id }, data: { isActive: !method.isActive } });
  refresh();
}
