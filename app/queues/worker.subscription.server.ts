import { createAppWorker } from "@app-platform/shopify-core";
import { processSingleShopSubscription, processSubscriptionCheck } from "./processors/subscription";
import { getWorkerRedisUrl, JOB_TYPES, SUBSCRIPTION_QUEUE_NAME } from "./queue.server";
export function startSubscriptionWorker() {
  return createAppWorker({
    name: SUBSCRIPTION_QUEUE_NAME,
    redisUrl: getWorkerRedisUrl(),
    concurrency: Number(process.env.SUBSCRIPTION_WORKER_CONCURRENCY ?? 4),
    limiter: { max: Number(process.env.SUBSCRIPTION_WORKER_RATE_LIMIT ?? 4), duration: 1000 },
    processor: async (job) => {
      if (job.name === JOB_TYPES.SUBSCRIPTION_CHECK) return processSubscriptionCheck();
      if (job.name === JOB_TYPES.SUBSCRIPTION_CHECK_FOR_SHOP)
        return processSingleShopSubscription(job.data as { shop: string });
      throw new Error(`Unknown subscription job ${job.name}`);
    },
  });
}
