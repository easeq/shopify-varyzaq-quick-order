import { upsertCronJob } from "@app-platform/shopify-core";
import { getSubscriptionQueue, JOB_TYPES } from "../queue.server";
export async function registerSubscriptionSchedulers() {
  await upsertCronJob({
    queue: getSubscriptionQueue(),
    schedulerId: "subscription-reconciliation",
    pattern: "17 * * * *",
    jobName: JOB_TYPES.SUBSCRIPTION_CHECK,
  });
}
