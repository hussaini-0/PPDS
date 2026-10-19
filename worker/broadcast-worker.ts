import { Worker } from "bullmq";

import { executeBroadcastCampaign } from "../src/modules/broadcasts/service";
import { redisConnection } from "../src/server/queue/connection";

const worker = new Worker(
  "broadcasts",
  async (job) => {
    if (job.name !== "execute-campaign") {
      throw new Error(`Unsupported broadcast job: ${job.name}`);
    }

    await executeBroadcastCampaign(String(job.data.campaignId));
  },
  { connection: redisConnection },
);

worker.on("completed", (job) => {
  console.log(`Broadcast job ${job.id} completed.`);
});

worker.on("failed", (job, error) => {
  console.error(`Broadcast job ${job?.id ?? "unknown"} failed.`, error);
});

async function shutdown() {
  await worker.close();
  await redisConnection.quit();
}

process.once("SIGINT", () => void shutdown().finally(() => process.exit(0)));
process.once("SIGTERM", () => void shutdown().finally(() => process.exit(0)));
