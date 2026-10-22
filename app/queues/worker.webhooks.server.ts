import { createAppWorker } from "@app-platform/shopify-core";
import {
  getWorkerRedisUrl,
  JOB_TYPES,
  WEBHOOK_QUEUE_NAME,
  type GdprQueueJobData,
} from "./queue.server";
import { processAppUninstalled, processGdprWebhook } from "./processors/webhooks";
export function startWebhookWorker() {
  return createAppWorker({
    name: WEBHOOK_QUEUE_NAME,
    redisUrl: getWorkerRedisUrl(),
    concurrency: Number(process.env.WEBHOOK_WORKER_CONCURRENCY ?? 8),
    processor: async (job) => {
      if (job.name === JOB_TYPES.WEBHOOK_APP_UNINSTALLED)
        return processAppUninstalled(job.data as { shop: string });
      if (job.name === JOB_TYPES.WEBHOOK_GDPR)
        return processGdprWebhook(job.data as GdprQueueJobData);
      throw new Error(`Unknown webhook job ${job.name}`);
    },
  });
}
