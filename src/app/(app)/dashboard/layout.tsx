import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/modules/auth/session";
import { getIntegrationMode } from "@/modules/integrations/mode";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: session.user.businessId },
    select: { name: true },
  });

  return (
    <AppShell
      businessName={business.name}
      role={session.user.role}
      mode={getIntegrationMode()}
    >
      {children}
    </AppShell>
  );
}
