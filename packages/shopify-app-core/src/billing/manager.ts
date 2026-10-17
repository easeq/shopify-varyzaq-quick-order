import type { ActiveSubscriptionResponse, BillingCheckResult } from "./partner-api.ts";
import type { PlanCatalog } from "./plans.ts";
import { buildShopifyPricingUrl } from "./pricing-url.ts";

export interface SubscriptionRecord<Tier extends string> {
  id: string;
  shop: string;
  plan: Tier | string;
  status: string;
  shopifyPlanHandle: string | null;
  isTestPlan: boolean;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  updatedAtShopify: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPersistence<Tier extends string> {
  get(shop: string): Promise<SubscriptionRecord<Tier> | null>;
  upsert(params: {
    shop: string;
    plan: Tier;
    status: string;
    shopifyPlanHandle: string | null;
    isTestPlan: boolean;
    currentPeriodEnd: Date | null;
    cancelledAt: Date | null;
    updatedAtShopify: Date;
  }): Promise<SubscriptionRecord<Tier>>;
}

export interface BillingCheckClient {
  checkBilling(params: {
    shopDomain: string;
    adminAccessToken: string;
    allowedPlanHandles?: readonly string[];
  }): Promise<BillingCheckResult>;
}

export interface BillingSyncResult<Tier extends string> {
  status: "ok" | "no_subscription" | "wrong_plan";
  subscription: SubscriptionRecord<Tier> | null;
  shopifySubscription: ActiveSubscriptionResponse | null;
  changed: boolean;
  currentHandles?: string[];
}

export function createBillingManager<
  Tier extends string,
  Capability extends string,
  Limits,
>(params: {
  plans: PlanCatalog<Tier, Capability, Limits>;
  persistence: SubscriptionPersistence<Tier>;
  client: BillingCheckClient;
  appHandle: string;
  fallbackTier: Tier;
  onSubscriptionChanged?: (params: {
    shop: string;
    previous: SubscriptionRecord<Tier> | null;
    current: SubscriptionRecord<Tier>;
    shopifySubscription: ActiveSubscriptionResponse | null;
  }) => Promise<void>;
  onSubscriptionSynced?: (params: {
    shop: string;
    previous: SubscriptionRecord<Tier> | null;
    current: SubscriptionRecord<Tier>;
    shopifySubscription: ActiveSubscriptionResponse | null;
    changed: boolean;
  }) => Promise<void>;
}) {
  async function runSyncCallbacks(callbackParams: {
    shop: string;
    previous: SubscriptionRecord<Tier> | null;
    current: SubscriptionRecord<Tier>;
    shopifySubscription: ActiveSubscriptionResponse | null;
    changed: boolean;
  }): Promise<void> {
    if (callbackParams.changed && params.onSubscriptionChanged) {
      await params.onSubscriptionChanged(callbackParams);
    }

    if (params.onSubscriptionSynced) {
      await params.onSubscriptionSynced(callbackParams);
    }
  }

  async function sync(paramsForShop: {
    shop: string;
    adminAccessToken: string;
  }): Promise<BillingSyncResult<Tier>> {
    const previous = await params.persistence.get(paramsForShop.shop);
    const result = await params.client.checkBilling({
      shopDomain: paramsForShop.shop,
      adminAccessToken: paramsForShop.adminAccessToken,
      allowedPlanHandles: params.plans.allHandles,
    });

    if (result.status !== "ok") {
      const current = await params.persistence.upsert({
        shop: paramsForShop.shop,
        plan: params.fallbackTier,
        status: result.status,
        shopifyPlanHandle: null,
        isTestPlan: false,
        currentPeriodEnd: null,
        cancelledAt: result.status === "no_subscription" ? new Date() : null,
        updatedAtShopify: new Date(),
      });

      const changed = subscriptionIdentityChanged(previous, current);

      await runSyncCallbacks({
        shop: paramsForShop.shop,
        previous,
        current,
        shopifySubscription: null,
        changed,
      });

      return {
        status: result.status,
        subscription: current,
        shopifySubscription: null,
        changed,
        ...(result.status === "wrong_plan" ? { currentHandles: result.currentHandles } : {}),
      };
    }

    const activeItem =
      result.subscription.items.find((item) => item.price.active) ?? result.subscription.items[0];
    const resolvedPlan = params.plans.resolveHandle(activeItem?.handle);

    if (!resolvedPlan) {
      const currentHandles = result.subscription.items.map((item) => item.handle);
      const current = await params.persistence.upsert({
        shop: paramsForShop.shop,
        plan: params.fallbackTier,
        status: "wrong_plan",
        shopifyPlanHandle: activeItem?.handle ?? null,
        isTestPlan: false,
        currentPeriodEnd: null,
        cancelledAt: null,
        updatedAtShopify: new Date(),
      });

      const changed = subscriptionIdentityChanged(previous, current);

      await runSyncCallbacks({
        shop: paramsForShop.shop,
        previous,
        current,
        shopifySubscription: result.subscription,
        changed,
      });

      return {
        status: "wrong_plan",
        subscription: current,
        shopifySubscription: result.subscription,
        changed,
        currentHandles,
      };
    }

    const current = await params.persistence.upsert({
      shop: paramsForShop.shop,
      plan: resolvedPlan.tier,
      status: "active",
      shopifyPlanHandle: resolvedPlan.handle,
      isTestPlan: resolvedPlan.isTest,
      currentPeriodEnd: result.subscription.currentBillingCycle?.endTime
        ? new Date(result.subscription.currentBillingCycle.endTime)
        : null,
      cancelledAt: null,
      updatedAtShopify: new Date(),
    });

    const changed = subscriptionIdentityChanged(previous, current);

    await runSyncCallbacks({
      shop: paramsForShop.shop,
      previous,
      current,
      shopifySubscription: result.subscription,
      changed,
    });

    return {
      status: "ok",
      subscription: current,
      shopifySubscription: result.subscription,
      changed,
    };
  }

  async function ensureBilling(paramsForShop: { shop: string; adminAccessToken: string }) {
    const result = await sync(paramsForShop);

    return {
      ...result,
      redirectUrl:
        result.status === "ok"
          ? null
          : buildShopifyPricingUrl({
              shop: paramsForShop.shop,
              appHandle: params.appHandle,
            }),
    };
  }

  return {
    sync,
    ensureBilling,
    getSubscription: params.persistence.get,
  };
}

function subscriptionIdentityChanged<Tier extends string>(
  previous: SubscriptionRecord<Tier> | null,
  current: SubscriptionRecord<Tier>,
): boolean {
  return (
    !previous ||
    previous.plan !== current.plan ||
    previous.status !== current.status ||
    previous.shopifyPlanHandle !== current.shopifyPlanHandle ||
    previous.isTestPlan !== current.isTestPlan
  );
}
