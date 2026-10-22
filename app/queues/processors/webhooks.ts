import { createGdprProcessor } from "@app-platform/shopify-core";
import prisma from "../../db.server";
import type { GdprQueueJobData } from "../queue.server";
export async function processAppUninstalled({ shop }: { shop: string }) {
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { shop } }),
    prisma.subscription.deleteMany({ where: { shop } }),
  ]);
}
const processGdpr = createGdprProcessor({
  async shopRedact({ shop }) {
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { shop } }),
      prisma.subscription.deleteMany({ where: { shop } }),
    ]);
  },
  async customersRedact() {},
  async customersDataRequest() {},
});
export async function processGdprWebhook({ topic, ...data }: GdprQueueJobData) {
  await processGdpr(topic, data);
}
