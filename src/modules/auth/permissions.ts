import type { UserRole } from "@prisma/client";

const permissionMatrix: Record<string, UserRole[]> = {
  VIEW_CONVERSATIONS: ["OWNER", "ADMIN", "AGENT", "VIEWER"],
  SEND_MESSAGES: ["OWNER", "ADMIN", "AGENT"],
  TAKE_OVER_CONVERSATIONS: ["OWNER", "ADMIN", "AGENT"],
  APPROVE_PAYMENTS: ["OWNER", "ADMIN"],
  MANAGE_SUBSCRIPTIONS: ["OWNER", "ADMIN"],
  CREATE_BROADCASTS: ["OWNER", "ADMIN"],
  MANAGE_CUSTOMERS: ["OWNER", "ADMIN", "AGENT"],
  MANAGE_TEMPLATES: ["OWNER", "ADMIN"],
  EDIT_KNOWLEDGE_BASE: ["OWNER", "ADMIN"],
  MANAGE_CMS: ["OWNER", "ADMIN"],
  VIEW_META_ADS: ["OWNER", "ADMIN", "VIEWER"],
  MANAGE_META_ADS: ["OWNER", "ADMIN"],
  CHANGE_INTEGRATIONS: ["OWNER"],
};

export type AppPermission = keyof typeof permissionMatrix;

export function hasPermission(role: UserRole, permission: AppPermission) {
  return permissionMatrix[permission].includes(role);
}
