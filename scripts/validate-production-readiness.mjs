import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "README.md",
  ".env.example",
  "IMPLEMENTATION_PLAN.md",
  "ARCHITECTURE.md",
  "DATABASE_SCHEMA.md",
  "WHATSAPP_SETUP.md",
  "META_ADS_SETUP.md",
  "BOT_BEHAVIOUR.md",
  "DEPLOYMENT.md",
  "TESTING.md",
  "SECURITY_REVIEW.md",
  "RELIABILITY_REVIEW.md",
  "PRODUCTION_READINESS.md",
  "docker-compose.yml",
  "compose.production.yml",
  "Dockerfile",
  "scripts/bootstrap-owner.ts",
  "scripts/smoke-production.mjs",
  "prisma/migrations/migration_lock.toml",
];

const requiredEnvKeys = [
  "DATABASE_URL",
  "REDIS_URL",
  "AUTH_SECRET",
  "APP_URL",
  "INTEGRATION_MODE",
  "META_GRAPH_API_VERSION",
  "META_APP_ID",
  "META_APP_SECRET",
  "META_ACCESS_TOKEN",
  "META_AD_ACCOUNT_ID",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_BUSINESS_ACCOUNT_ID",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_PUBLIC_NUMBER",
  "AI_PROVIDER",
  "AI_API_KEY",
  "AI_MODEL",
  "FILE_STORAGE_PROVIDER",
  "S3_BUCKET",
  "S3_REGION",
  "PUBLIC_ASSET_BASE_URL",
  "ENCRYPTION_KEY",
];

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const envExample = readFileSync(join(root, ".env.example"), "utf8");
const failures = [];

function isPrivateRenderUrl(value, hostnamePrefix) {
  try {
    const hostname = new URL(value).hostname;
    return hostname.startsWith(hostnamePrefix) && !hostname.includes(".");
  } catch {
    return false;
  }
}

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    failures.push(`Missing required file: ${file}`);
  }
}

for (const key of requiredEnvKeys) {
  if (!envExample.includes(`${key}=`)) {
    failures.push(`Missing .env.example key: ${key}`);
  }
}

for (const script of [
  "build",
  "lint",
  "typecheck",
  "test",
  "prisma:migrate",
  "prisma:deploy",
  "prisma:seed",
  "bootstrap:owner",
  "smoke:production",
  "worker:followups",
  "worker:subscriptions",
  "worker:broadcasts",
]) {
  if (!packageJson.scripts?.[script]) {
    failures.push(`Missing package script: ${script}`);
  }
}

if (process.argv.includes("--production")) {
  const fileName = process.argv.at(-1);
  const filePath = join(root, fileName ?? ".env.production");

  if (!existsSync(filePath)) {
    failures.push(`Missing production environment file: ${fileName}`);
  } else {
    const values = Object.fromEntries(
      readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .filter((line) => line && !line.trimStart().startsWith("#") && line.includes("="))
        .map((line) => {
          const separator = line.indexOf("=");
          return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
        }),
    );
    const requiredProductionValues = [
      "NODE_ENV",
      "DATABASE_URL",
      "REDIS_URL",
      "AUTH_SECRET",
      "APP_URL",
      "ENCRYPTION_KEY",
      "S3_BUCKET",
      "PUBLIC_ASSET_BASE_URL",
    ];

    for (const key of requiredProductionValues) {
      if (!values[key] || /replace|example|change-me/i.test(values[key])) {
        failures.push(`Production value ${key} is missing or still a placeholder.`);
      }
    }

    if (values.APP_URL && !values.APP_URL.startsWith("https://")) {
      failures.push("Production APP_URL must use HTTPS.");
    }
    if (values.NODE_ENV !== "production") {
      failures.push("Production NODE_ENV must be production.");
    }
    if (values.INTEGRATION_MODE !== "live") {
      failures.push("Production INTEGRATION_MODE must be live.");
    }
    const renderPrivatePostgres = values.RENDER === "true" && isPrivateRenderUrl(values.DATABASE_URL, "dpg-");
    const renderPrivateRedis = values.RENDER === "true" && isPrivateRenderUrl(values.REDIS_URL, "red-");
    if (values.DATABASE_URL && !renderPrivatePostgres && !/[?&]sslmode=(require|verify-ca|verify-full)/i.test(values.DATABASE_URL)) {
      failures.push("Production DATABASE_URL must use TLS or Render's private network.");
    }
    if (values.REDIS_URL && !renderPrivateRedis && !values.REDIS_URL.startsWith("rediss://")) {
      failures.push("Production REDIS_URL must use TLS or Render's private network.");
    }
    if ((values.AUTH_SECRET?.length ?? 0) < 32) {
      failures.push("Production AUTH_SECRET must contain at least 32 characters.");
    }
    if ((values.ENCRYPTION_KEY?.length ?? 0) < 32) {
      failures.push("Production ENCRYPTION_KEY must contain at least 32 characters.");
    }
    if (values.FILE_STORAGE_PROVIDER !== "s3") {
      failures.push("Production FILE_STORAGE_PROVIDER must be s3.");
    }
    for (const key of [
      "META_APP_SECRET",
      "META_ACCESS_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "WHATSAPP_VERIFY_TOKEN",
      "WHATSAPP_PUBLIC_NUMBER",
    ]) {
      if (!values[key] || /replace|example|change-me|dev-verify-token/i.test(values[key])) {
        failures.push(`Live integration value ${key} is missing or still a placeholder.`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Production readiness check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production readiness check passed.");
