import { Worker } from "bullmq";

import { executeFollowUpJob } from "../src/modules/follow-ups/service";
import { redisConnection } from "../src/server/queue/connection";

const worker = new Worker(
  "follow-ups",
  async (job) => {
    const followUpJobId = job.data.followUpJobId as string | undefined;

    if (!followUpJobId) {
      throw new Error("Missing followUpJobId.");
    }

    return executeFollowUpJob(followUpJobId);
  },
  { connection: redisConnection },
);

worker.on("completed", (job) => {
  console.log(`Follow-up job ${job.id} completed.`);
});

worker.on("failed", (job, error) => {
  console.error(`Follow-up job ${job?.id ?? "unknown"} failed:`, error.message);
});

async function shutdown() {
  await worker.close();
  await redisConnection.quit();
}

process.once("SIGINT", () => void shutdown().finally(() => process.exit(0)));
process.once("SIGTERM", () => void shutdown().finally(() => process.exit(0)));
