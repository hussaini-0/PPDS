import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/session";
import { getStorageProvider } from "@/server/storage/provider";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await requirePermission("APPROVE_PAYMENTS");
  const { orderId } = await params;
  const order = await prisma.storeOrder.findFirst({
    where: { id: orderId, businessId: session.user.businessId },
    include: { paymentProofFile: true },
  });
  if (!order?.paymentProofFile) return NextResponse.json({ error: "Payment proof not found." }, { status: 404 });
  const buffer = await getStorageProvider().read(order.paymentProofFile.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": order.paymentProofFile.mimeType,
      "Content-Disposition": `inline; filename="${order.paymentProofFile.originalName.replace(/["\r\n]/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
