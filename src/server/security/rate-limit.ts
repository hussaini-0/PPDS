import Redis from "ioredis";

import { env } from "@/lib/env";

export type RateLimitRule = {
  windowMs: number;
  maxRequests: number;
};

export type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

declare global {
  var rateLimitRedis: Redis | undefined;
}

const rateLimitRedis =
  global.rateLimitRedis ??
  new Redis(env.REDIS_URL, {
    lazyConnect: true,
    enableReadyCheck: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    commandTimeout: 2_000,
  });

rateLimitRedis.on("error", () => {
  // Callers decide whether an unavailable shared limiter should fail closed.
});

if (process.env.NODE_ENV !== "production") {
  global.rateLimitRedis = rateLimitRedis;
}

const fixedWindowScript = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {count, ttl}
`;

export function checkRateLimit({
  key,
  rule,
  now = Date.now(),
  store = buckets,
}: {
  key: string;
  rule: RateLimitRule;
  now?: number;
  store?: Map<string, RateLimitEntry>;
}): RateLimitResult {
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const entry = { count: 1, resetAt: now + rule.windowMs };
    store.set(key, entry);

    return {
      allowed: true,
      remaining: rule.maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }

  if (existing.count >= rule.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: rule.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

export function resetRateLimitStore() {
  buckets.clear();
}

export async function checkDistributedRateLimit({
  key,
  rule,
  now = Date.now(),
}: {
  key: string;
  rule: RateLimitRule;
  now?: number;
}): Promise<RateLimitResult> {
  const result = (await rateLimitRedis.eval(
    fixedWindowScript,
    1,
    `ppds:rate-limit:${key}`,
    rule.windowMs,
  )) as [number, number];
  const [count, ttl] = result.map(Number);
  const remainingTtl = ttl > 0 ? ttl : rule.windowMs;

  return {
    allowed: count <= rule.maxRequests,
    remaining: Math.max(0, rule.maxRequests - count),
    resetAt: now + remainingTtl,
  };
}
