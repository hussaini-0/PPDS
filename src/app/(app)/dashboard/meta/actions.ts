"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/modules/auth/session";
import {
  sendPendingMetaConversionEvents,
  syncMockMetaAds,
} from "@/modules/meta-ads/service";

export async function syncMetaAdsAction() {
  const session = await requirePermission("MANAGE_META_ADS");

  await syncMockMetaAds({
    businessId: session.user.businessId,
    actorId: session.user.id,
  });

  revalidatePath("/dashboard/meta");
  revalidatePath("/dashboard");
}

export async function sendMetaConversionsAction() {
  const session = await requirePermission("MANAGE_META_ADS");

  await sendPendingMetaConversionEvents({
    businessId: session.user.businessId,
    actorId: session.user.id,
  });

  revalidatePath("/dashboard/meta");
}
