import prisma from "../db.server";
import type { SubscriptionPersistence } from "@app-platform/shopify-core";
import type { Tier } from "../config/billing.config";

export const subscriptionPersistence: SubscriptionPersistence<Tier> = {
  get(shop) {
    return prisma.subscription.findUnique({ where: { shop } });
  },
  upsert(params) {
    return prisma.subscription.upsert({
      where: { shop: params.shop },
      create: params,
      update: params,
    });
  },
};
