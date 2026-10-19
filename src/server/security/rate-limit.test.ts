import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/server/security/rate-limit";

describe("rate limiter", () => {
  it("blocks requests after the fixed-window limit", () => {
    const store = new Map();
    const rule = { windowMs: 60_000, maxRequests: 2 };

    expect(checkRateLimit({ key: "ip:a", rule, now: 1, store }).allowed).toBe(true);
    expect(checkRateLimit({ key: "ip:a", rule, now: 2, store }).allowed).toBe(true);
    expect(checkRateLimit({ key: "ip:a", rule, now: 3, store }).allowed).toBe(false);
  });

  it("resets after the window expires", () => {
    const store = new Map();
    const rule = { windowMs: 10, maxRequests: 1 };

    expect(checkRateLimit({ key: "ip:a", rule, now: 1, store }).allowed).toBe(true);
    expect(checkRateLimit({ key: "ip:a", rule, now: 2, store }).allowed).toBe(false);
    expect(checkRateLimit({ key: "ip:a", rule, now: 12, store }).allowed).toBe(true);
  });
});
