import { redirect } from "next/navigation";

import { auth } from "@/modules/auth/auth";
import { hasPermission, type AppPermission } from "@/modules/auth/permissions";

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  return session;
}

export async function requirePermission(permission: AppPermission) {
  const session = await requireSession();

  if (!hasPermission(session.user.role, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return session;
}
