import { runSubscriptionLifecycleJob } from "../src/modules/subscriptions/service";
import { prisma } from "../src/lib/prisma";

async function main() {
  const intervalMs = Number(process.env.SUBSCRIPTION_JOB_INTERVAL_MS ?? 86_400_000);

  if (!Number.isFinite(intervalMs) || intervalMs < 60_000) {
    throw new Error("SUBSCRIPTION_JOB_INTERVAL_MS must be at least 60000.");
  }

  let stopping = false;
  let stopWaiting: (() => void) | undefined;
  const stop = () => {
    stopping = true;
    stopWaiting?.();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  while (!stopping) {
    const result = await runSubscriptionLifecycleJob();
    console.log("Subscription lifecycle job complete:", result);

    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        stopWaiting = undefined;
        resolve();
      }, intervalMs);
      stopWaiting = () => {
        clearTimeout(timer);
        stopWaiting = undefined;
        resolve();
      };
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
