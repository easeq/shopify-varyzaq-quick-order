import type { JobsOptions, Queue } from "bullmq";
import {
  buildQueueName,
  createAppQueue,
  getRuntimeIdentity,
  requireEnvironmentVariable,
  type GdprJobData,
  type GdprTopic,
} from "@app-platform/shopify-core";
export const JOB_TYPES = {
  SUBSCRIPTION_CHECK: "internal:subscription-check",
  SUBSCRIPTION_CHECK_FOR_SHOP: "internal:subscription-check-for-shop",
  WEBHOOK_APP_UNINSTALLED: "webhook:app-uninstalled",
  WEBHOOK_GDPR: "webhook:gdpr",
} as const;
export type GdprQueueJobData = GdprJobData & { topic: GdprTopic };
const redisUrl = requireEnvironmentVariable("REDIS_URL");
const identity = getRuntimeIdentity();
export const WEBHOOK_QUEUE_NAME = buildQueueName(identity, "webhooks");
export const SUBSCRIPTION_QUEUE_NAME = buildQueueName(identity, "subscriptions");
let webhookQueue: Queue | null = null;
let subscriptionQueue: Queue | null = null;
const defaults: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
};
export function getWebhookQueue() {
  webhookQueue ??= createAppQueue({
    name: WEBHOOK_QUEUE_NAME,
    redisUrl,
    defaultJobOptions: defaults,
  });
  return webhookQueue;
}
export function getSubscriptionQueue() {
  subscriptionQueue ??= createAppQueue({
    name: SUBSCRIPTION_QUEUE_NAME,
    redisUrl,
    defaultJobOptions: defaults,
  });
  return subscriptionQueue;
}
export function getWorkerRedisUrl() {
  return redisUrl;
}
