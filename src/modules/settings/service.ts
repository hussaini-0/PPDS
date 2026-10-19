import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PAYMENT_SETTINGS,
  PAYMENT_SETTINGS_PROVIDER,
} from "@/modules/settings/constants";

export async function listIntegrationSettings(businessId: string) {
  return prisma.integrationSetting.findMany({
    where: { businessId },
    orderBy: { provider: "asc" },
  });
}

export async function getPaymentSettings(businessId: string) {
  const settings = await prisma.integrationSetting.findUnique({
    where: {
      businessId_provider: {
        businessId,
        provider: PAYMENT_SETTINGS_PROVIDER,
      },
    },
  });

  return (settings?.settings as typeof DEFAULT_PAYMENT_SETTINGS | null) ?? DEFAULT_PAYMENT_SETTINGS;
}
