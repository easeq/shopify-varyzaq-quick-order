import assert from "node:assert/strict";
import test from "node:test";
import { createBillingManager } from "../src/billing/manager.ts";
import { createPlanCatalog } from "../src/billing/plans.ts";
import type { SubscriptionRecord } from "../src/billing/manager.ts";

const plans = createPlanCatalog({
  order: ["free", "pro"] as const,
  definitions: [
    {
      tier: "free",
      displayName: "Free",
      handle: "free",
      capabilityAdditions: ["base"] as const,
      limits: { records: 10 },
    },
    {
      tier: "pro",
      displayName: "Pro",
      handle: "pro",
      capabilityAdditions: ["batch"] as const,
      limits: { records: Number.POSITIVE_INFINITY },
    },
  ],
});

function createMemoryPersistence() {
  let record: SubscriptionRecord<"free" | "pro"> | null = null;

  return {
    async get() {
      return record;
    },
    async upsert(input: {
      shop: string;
      plan: "free" | "pro";
      status: string;
      shopifyPlanHandle: string | null;
      isTestPlan: boolean;
      currentPeriodEnd: Date | null;
      cancelledAt: Date | null;
      updatedAtShopify: Date;
    }) {
      const now = new Date();
      record = {
        id: "sub_1",
        shop: input.shop,
        plan: input.plan,
        status: input.status,
        shopifyPlanHandle: input.shopifyPlanHandle,
        isTestPlan: input.isTestPlan,
        currentPeriodEnd: input.currentPeriodEnd,
        cancelledAt: input.cancelledAt,
        updatedAtShopify: input.updatedAtShopify,
        createdAt: record?.createdAt ?? now,
        updatedAt: now,
      };
      return record;
    },
  };
}

test("billing manager caches the normalized tier and exact -test handle", async () => {
  const persistence = createMemoryPersistence();
  const manager = createBillingManager({
    plans,
    persistence,
    appHandle: "example-app",
    fallbackTier: "free" as const,
    client: {
      async checkBilling() {
        return {
          status: "ok" as const,
          subscription: {
            billingPeriod: "EVERY_30_DAYS",
            cancelAtEndOfCycle: false,
            trialEndsAt: null,
            currentBillingCycle: {
              startTime: "2026-09-01T00:00:00Z",
              endTime: "2026-10-01T00:00:00Z",
            },
            items: [
              {
                handle: "pro-test",
                description: "Pro boundary test",
                price: {
                  __typename: "FlatRatePrice",
                  active: true,
                  currency: "USD",
                  amount: "0.00",
                },
              },
            ],
            pendingUpdate: null,
          },
        };
      },
    },
  });

  const result = await manager.ensureBilling({
    shop: "example.myshopify.com",
    adminAccessToken: "token",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.subscription?.plan, "pro");
  assert.equal(result.subscription?.shopifyPlanHandle, "pro-test");
  assert.equal(result.subscription?.isTestPlan, true);
  assert.equal(result.subscription?.status, "active");
  assert.equal(result.redirectUrl, null);
});

test("billing manager returns Shopify's hosted pricing URL when no plan exists", async () => {
  const persistence = createMemoryPersistence();
  const manager = createBillingManager({
    plans,
    persistence,
    appHandle: "example-app",
    fallbackTier: "free" as const,
    client: {
      async checkBilling() {
        return { status: "no_subscription" as const };
      },
    },
  });

  const result = await manager.ensureBilling({
    shop: "example.myshopify.com",
    adminAccessToken: "token",
  });

  assert.equal(result.status, "no_subscription");
  assert.equal(result.subscription?.plan, "free");
  assert.equal(result.subscription?.shopifyPlanHandle, null);
  assert.equal(result.subscription?.isTestPlan, false);
  assert.match(result.redirectUrl ?? "", /charges\/example-app\/pricing_plans$/);
});
