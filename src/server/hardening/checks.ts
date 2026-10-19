import type { AppEnv } from "@/lib/env";

export type HardeningCheck = {
  key: string;
  status: "pass" | "warn" | "fail";
  summary: string;
};

export function evaluateSecurityConfig(
  env: Pick<
    AppEnv,
    | "NODE_ENV"
    | "DATABASE_URL"
    | "REDIS_URL"
    | "AUTH_SECRET"
    | "APP_URL"
    | "INTEGRATION_MODE"
    | "META_APP_SECRET"
    | "WHATSAPP_VERIFY_TOKEN"
    | "FILE_STORAGE_PROVIDER"
    | "S3_BUCKET"
    | "PUBLIC_ASSET_BASE_URL"
    | "ENCRYPTION_KEY"
  >,
): HardeningCheck[] {
  const checks: HardeningCheck[] = [];

  checks.push({
    key: "auth_secret",
    status:
      env.NODE_ENV === "production" && env.AUTH_SECRET === "development-secret-change-me"
        ? "fail"
        : env.AUTH_SECRET.length < 24
          ? "warn"
          : "pass",
    summary: "Auth secret must be high entropy and never use the development default in production.",
  });

  checks.push({
    key: "database_tls",
    status:
      env.NODE_ENV === "production" && !/[?&]sslmode=(require|verify-ca|verify-full)/i.test(env.DATABASE_URL)
        ? "fail"
        : "pass",
    summary: "Production PostgreSQL connections must explicitly require TLS.",
  });

  checks.push({
    key: "redis_tls",
    status:
      env.NODE_ENV === "production" && !env.REDIS_URL.startsWith("rediss://")
        ? "fail"
        : "pass",
    summary: "Production Redis connections must use TLS.",
  });

  checks.push({
    key: "app_url_https",
    status:
      env.NODE_ENV === "production" && !env.APP_URL.startsWith("https://")
        ? "fail"
        : "pass",
    summary: "Production app URL should use HTTPS for secure auth callbacks and webhooks.",
  });

  checks.push({
    key: "integration_mode",
    status:
      env.NODE_ENV === "production" && env.INTEGRATION_MODE === "mock"
        ? "fail"
        : "pass",
    summary: "Mock mode is useful locally but should be an explicit production decision.",
  });

  checks.push({
    key: "webhook_signature",
    status:
      env.NODE_ENV === "production" &&
      env.INTEGRATION_MODE === "live" &&
      (!env.META_APP_SECRET || env.WHATSAPP_VERIFY_TOKEN === "dev-verify-token")
        ? "fail"
        : "pass",
    summary: "Live Meta webhooks require an app secret and a non-default verification token.",
  });

  checks.push({
    key: "private_storage",
    status:
      env.NODE_ENV === "production" &&
      (env.FILE_STORAGE_PROVIDER !== "s3" ||
        !env.S3_BUCKET ||
        !env.PUBLIC_ASSET_BASE_URL)
        ? "fail"
        : "pass",
    summary: "Production uploads must use a configured private S3-compatible bucket.",
  });

  checks.push({
    key: "encryption_key",
    status:
      env.NODE_ENV === "production" && env.ENCRYPTION_KEY.length < 32
        ? "fail"
        : "pass",
    summary: "The encryption key must contain at least 32 characters in production.",
  });

  return checks;
}

export function evaluateReliabilityConfig({
  databaseOk,
  redisOk,
  workersConfigured,
}: {
  databaseOk: boolean;
  redisOk: boolean;
  workersConfigured: boolean;
}): HardeningCheck[] {
  return [
    {
      key: "database",
      status: databaseOk ? "pass" : "fail",
      summary: "PostgreSQL must be reachable before accepting production traffic.",
    },
    {
      key: "redis",
      status: redisOk ? "pass" : "fail",
      summary: "Redis must be reachable for follow-ups, broadcasts, and webhook job queues.",
    },
    {
      key: "workers",
      status: workersConfigured ? "pass" : "warn",
      summary: "Follow-up, subscription lifecycle, and broadcast workers must be deployed separately from the web process.",
    },
  ];
}
