import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  evaluateReliabilityConfig,
  evaluateSecurityConfig,
} from "@/server/hardening/checks";
import { redisConnection } from "@/server/queue/connection";

export async function getHealthStatus() {
  const [dbResult, redisResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redisConnection.ping(),
  ]);

  const databaseOk = dbResult.status === "fulfilled";
  const redisOk = redisResult.status === "fulfilled";
  const security = evaluateSecurityConfig(env);
  const reliability = evaluateReliabilityConfig({
    databaseOk,
    redisOk,
    workersConfigured: true,
  });
  const hardeningFailed = [...security, ...reliability].some(
    (check) => check.status === "fail",
  );

  return {
    status:
      databaseOk && redisOk && !hardeningFailed
        ? "ok"
        : "degraded",
    checks: {
      database: databaseOk ? "ok" : "error",
      redis: redisOk ? "ok" : "error",
    },
    hardening: {
      security,
      reliability,
    },
  };
}
