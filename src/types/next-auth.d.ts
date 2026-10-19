import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      businessId: string;
    };
  }

  interface User {
    role: UserRole;
    businessId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    businessId?: string;
  }
}
