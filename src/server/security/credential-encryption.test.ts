import { describe, expect, it } from "vitest";

import { decryptCredential, encryptCredential } from "@/server/security/credential-encryption";

describe("credential encryption", () => {
  it("round trips credential fields without storing readable values", () => {
    const input = { login: "customer@example.com", password: "private-password", accessUrl: "https://example.com" };
    const encrypted = encryptCredential(input);

    expect(encrypted).not.toContain(input.login);
    expect(encrypted).not.toContain(input.password);
    expect(decryptCredential(encrypted)).toEqual(input);
  });

  it("rejects modified encrypted payloads", () => {
    const encrypted = encryptCredential({ licenseKey: "ABC-123" });
    expect(() => decryptCredential(`${encrypted.slice(0, -1)}x`)).toThrow();
  });
});
