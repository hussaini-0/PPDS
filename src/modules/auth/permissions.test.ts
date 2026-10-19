import { describe, expect, it } from "vitest";

import { hasPermission } from "@/modules/auth/permissions";

describe("permission matrix", () => {
  it("keeps financial and broadcast mutations away from agents and viewers", () => {
    expect(hasPermission("AGENT", "APPROVE_PAYMENTS")).toBe(false);
    expect(hasPermission("VIEWER", "CREATE_BROADCASTS")).toBe(false);
    expect(hasPermission("AGENT", "SEND_MESSAGES")).toBe(true);
  });

  it("limits CMS and Meta management to owners and admins", () => {
    expect(hasPermission("OWNER", "MANAGE_CMS")).toBe(true);
    expect(hasPermission("ADMIN", "MANAGE_META_ADS")).toBe(true);
    expect(hasPermission("VIEWER", "MANAGE_META_ADS")).toBe(false);
  });
});
