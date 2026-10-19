import { Queue } from "bullmq";

import { redisConnection } from "@/server/queue/connection";

let followUpQueue: Queue | null = null;
let webhookProcessingQueue: Queue | null = null;
let broadcastQueue: Queue | null = null;

export function getFollowUpQueue() {
  followUpQueue ??= new Queue("follow-ups", {
    connection: redisConnection,
  });

  return followUpQueue;
}

export function getWebhookProcessingQueue() {
  webhookProcessingQueue ??= new Queue("webhook-processing", {
    connection: redisConnection,
  });

  return webhookProcessingQueue;
}

export function getBroadcastQueue() {
  broadcastQueue ??= new Queue("broadcasts", {
    connection: redisConnection,
  });

  return broadcastQueue;
}
