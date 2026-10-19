import { env } from "@/lib/env";

export type IntegrationMode = "mock" | "live";

export function getIntegrationMode(): IntegrationMode {
  return env.INTEGRATION_MODE;
}

export function isMockMode() {
  return getIntegrationMode() === "mock";
}

export function assertMockMode(operation: string) {
  if (!isMockMode()) {
    throw new Error(`${operation} is disabled while live integrations are active.`);
  }
}
