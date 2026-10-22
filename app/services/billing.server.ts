import {
  PartnerBillingClient,
  createBillingManager,
  isSubscriptionStale,
  requireEnvironmentVariable,
} from "@app-platform/shopify-core";
import { PLAN_CATALOG, hasCapability, type Capability, type Tier } from "../config/billing.config";
import { subscriptionPersistence } from "../models/subscription.server";
import { syncStorefrontEntitlements } from "./storefront-entitlements.server";

export { isSubscriptionStale };
let manager: ReturnType<typeof createManager> | null = null;
function createManager() {
  const client = new PartnerBillingClient({
    adminApiVersion: process.env.SHOPIFY_API_VERSION ?? "2026-07",
    partnerApiVersion: process.env.SHOPIFY_PARTNER_API_VERSION ?? "2026-07",
    partnerOrgId: requireEnvironmentVariable("SHOPIFY_PARTNER_ORG_ID"),
    partnerAccessToken: requireEnvironmentVariable("SHOPIFY_PARTNER_ACCESS_TOKEN"),
    appGid: requireEnvironmentVariable("SHOPIFY_APP_GID"),
  });
  return createBillingManager({
    plans: PLAN_CATALOG,
    persistence: subscriptionPersistence,
    client,
    appHandle: requireEnvironmentVariable("APP_HANDLE"),
    fallbackTier: "free" as const,
    onSubscriptionSynced: async ({ shop, current }) => {
      await syncStorefrontEntitlements({ shop, plan: current.plan as Tier }).catch((error) =>
        console.error("[billing] entitlement sync failed", error),
      );
    },
  });
}
function getManager() {
  manager ??= createManager();
  return manager;
}
export const ensureBilling = (params: { shop: string; adminAccessToken: string }) =>
  getManager().ensureBilling(params);
export const syncSubscriptionFromShopify = (params: { shop: string; adminAccessToken: string }) =>
  getManager().sync(params);
export const getSubscription = (shop: string) => subscriptionPersistence.get(shop);
export async function getShopTier(shop: string): Promise<Tier> {
  const sub = await getSubscription(shop);
  if (sub?.status !== "active") return "free";
  return (
    PLAN_CATALOG.normalizeHandle(sub.plan) ??
    (PLAN_CATALOG.order.includes(sub.plan as Tier) ? (sub.plan as Tier) : "free")
  );
}
export async function shopHasCapability(shop: string, capability: Capability) {
  return hasCapability(await getShopTier(shop), capability);
}
