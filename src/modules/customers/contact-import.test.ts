import { describe, expect, it } from "vitest";

import { parseContactCsv } from "@/modules/customers/contact-import";

describe("contact CSV import", () => {
  it("normalizes Pakistani numbers and keeps consent explicit", () => {
    const result = parseContactCsv("name,phone,email,tags,marketing_consent\nAyesha,03001234567,ayesha@example.com,prospect|retail,yes");
    expect(result.errors).toEqual([]);
    expect(result.records[0]).toMatchObject({
      fullName: "Ayesha",
      normalizedPhoneNumber: "+923001234567",
      marketingOptIn: true,
      tags: ["prospect", "retail"],
    });
  });

  it("rejects duplicates and invalid emails", () => {
    const result = parseContactCsv("name,phone,email\nA,03001234567,bad\nB,+923001234567,b@example.com\nC,+923001234567,c@example.com");
    expect(result.records).toHaveLength(1);
    expect(result.errors).toEqual([
      { row: 2, message: "Email address is invalid." },
      { row: 4, message: "Duplicate phone number in this file." },
    ]);
  });

  it("requires name and phone headers", () => {
    expect(() => parseContactCsv("email,city\na@example.com,Lahore")).toThrow("requires name and phone");
  });
});
