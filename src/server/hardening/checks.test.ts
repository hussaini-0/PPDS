import { describe, expect, it } from "vitest";

import {
  evaluateReliabilityConfig,
  evaluateSecurityConfig,
} from "@/server/hardening/checks";

describe("hardening checks", () => {
  it("fails production when the default auth secret is still used", () => {
    const checks = evaluateSecurityConfig({
      NODE_ENV: "production",
      RENDER: "false",
      DATABASE_URL: "postgresql://db/ppds?sslmode=require",
      REDIS_URL: "rediss://redis:6379",
      AUTH_SECRET: "development-secret-change-me",
      APP_URL: "https://example.com",
      INTEGRATION_MODE: "live",
      META_APP_SECRET: "meta-secret",
      WHATSAPP_VERIFY_TOKEN: "production-token",
      FILE_STORAGE_PROVIDER: "s3",
      S3_BUCKET: "private-bucket",
      PUBLIC_ASSET_BASE_URL: "https://assets.example.com",
      ENCRYPTION_KEY: "a-secure-encryption-key-with-32-chars",
    });

    expect(checks.find((check) => check.key === "auth_secret")?.status).toBe("fail");
  });

  it("fails production when private storage is not configured", () => {
    const checks = evaluateSecurityConfig({
      NODE_ENV: "production",
      RENDER: "false",
      DATABASE_URL: "postgresql://db/ppds?sslmode=require",
      REDIS_URL: "rediss://redis:6379",
      AUTH_SECRET: "a-secure-auth-secret-with-32-characters",
      APP_URL: "https://example.com",
      INTEGRATION_MODE: "mock",
      META_APP_SECRET: "",
      WHATSAPP_VERIFY_TOKEN: "dev-verify-token",
      FILE_STORAGE_PROVIDER: "local",
      S3_BUCKET: "",
      PUBLIC_ASSET_BASE_URL: "",
      ENCRYPTION_KEY: "a-secure-encryption-key-with-32-chars",
    });

    expect(checks.find((check) => check.key === "private_storage")?.status).toBe("fail");
  });

  it("fails production when integrations or service transport remain non-production", () => {
    const checks = evaluateSecurityConfig({
      NODE_ENV: "production",
      RENDER: "false",
      DATABASE_URL: "postgresql://db/ppds",
      REDIS_URL: "redis://redis:6379",
      AUTH_SECRET: "a-secure-auth-secret-with-32-characters",
      APP_URL: "https://example.com",
      INTEGRATION_MODE: "mock",
      META_APP_SECRET: "",
      WHATSAPP_VERIFY_TOKEN: "dev-verify-token",
      FILE_STORAGE_PROVIDER: "s3",
      S3_BUCKET: "private-bucket",
      PUBLIC_ASSET_BASE_URL: "https://assets.example.com",
      ENCRYPTION_KEY: "a-secure-encryption-key-with-32-chars",
    });

    expect(checks.find((check) => check.key === "database_tls")?.status).toBe("fail");
    expect(checks.find((check) => check.key === "redis_tls")?.status).toBe("fail");
    expect(checks.find((check) => check.key === "integration_mode")?.status).toBe("fail");
  });

  it("accepts Render internal database and key value URLs only on Render", () => {
    const checks = evaluateSecurityConfig({
      NODE_ENV: "production",
      RENDER: "true",
      DATABASE_URL: "postgresql://user:password@dpg-example-a/ppds",
      REDIS_URL: "redis://red-example:6379",
      AUTH_SECRET: "a-secure-auth-secret-with-32-characters",
      APP_URL: "https://example.com",
      INTEGRATION_MODE: "live",
      META_APP_SECRET: "meta-secret",
      WHATSAPP_VERIFY_TOKEN: "production-token",
      FILE_STORAGE_PROVIDER: "s3",
      S3_BUCKET: "private-bucket",
      PUBLIC_ASSET_BASE_URL: "https://assets.example.com",
      ENCRYPTION_KEY: "a-secure-encryption-key-with-32-chars",
    });

    expect(checks.find((check) => check.key === "database_tls")?.status).toBe("pass");
    expect(checks.find((check) => check.key === "redis_tls")?.status).toBe("pass");
  });

  it("flags missing reliability dependencies", () => {
    const checks = evaluateReliabilityConfig({
      databaseOk: true,
      redisOk: false,
      workersConfigured: false,
    });

    expect(checks.find((check) => check.key === "redis")?.status).toBe("fail");
    expect(checks.find((check) => check.key === "workers")?.status).toBe("warn");
  });
});
