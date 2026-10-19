import Redis from "ioredis";

import { env } from "@/lib/env";

declare global {
  var bullRedis: Redis | undefined;
}

export const redisConnection =
  global.bullRedis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

redisConnection.on("error", () => {
  // Redis may be unavailable during static builds or before local infra starts.
});

if (process.env.NODE_ENV !== "production") {
  global.bullRedis = redisConnection;
}
