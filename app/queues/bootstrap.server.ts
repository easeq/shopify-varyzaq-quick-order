import type { Worker } from "bullmq";
import {
  installWorkerShutdown,
  parseWorkerRoles as parseFrameworkWorkerRoles,
  waitForWorkersReady,
} from "@app-platform/shopify-core";
import { registerSubscriptionSchedulers } from "./schedulers/subscription.scheduler.server";
import { startSubscriptionWorker } from "./worker.subscription.server";
import { startWebhookWorker } from "./worker.webhooks.server";
export const WORKER_ROLES = ["subscriptions", "webhooks"] as const;
export type WorkerRole = (typeof WORKER_ROLES)[number];
export function parseWorkerRoles(value = process.env.WORKER_ROLES): WorkerRole[] {
  return parseFrameworkWorkerRoles({ availableRoles: WORKER_ROLES, value });
}
export async function startWorkers(
  roles: readonly WorkerRole[] = parseWorkerRoles(),
): Promise<Worker[]> {
  const workers = roles.map((role) =>
    role === "subscriptions" ? startSubscriptionWorker() : startWebhookWorker(),
  );
  await waitForWorkersReady({
    workers,
    timeoutMs: Number(process.env.WORKER_READY_TIMEOUT_MS ?? 30000),
  });
  if (roles.includes("subscriptions")) await registerSubscriptionSchedulers();
  installWorkerShutdown({ workers });
  return workers;
}
