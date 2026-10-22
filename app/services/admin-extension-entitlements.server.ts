import {
  getPlanCapabilities,
  getPlanLimit,
  PLAN_CATALOG,
  type Tier,
} from "../config/billing.config";
import {
  getSubscription,
  isSubscriptionStale,
  syncSubscriptionFromShopify,
} from "./billing.server";

export async function getAdminExtensionEntitlements(params: {
  shop: string;
  adminAccessToken: string;
}) {
  let sub = await getSubscription(params.shop);
  if (
    !sub ||
    isSubscriptionStale(
      sub.updatedAtShopify,
      Number(process.env.ADMIN_ENTITLEMENT_MAX_AGE_HOURS ?? 24),
    )
  ) {
    try {
      sub = (await syncSubscriptionFromShopify(params)).subscription;
    } catch (error) {
      if (sub?.status !== "active") throw error;
    }
  }
  const tier: Tier =
    sub?.status === "active"
      ? (PLAN_CATALOG.normalizeHandle(sub.plan) ??
        (PLAN_CATALOG.order.includes(sub.plan as Tier) ? (sub.plan as Tier) : "free"))
      : "free";
  return {
    tier,
    planDisplayName: PLAN_CATALOG.plans[tier].displayName,
    capabilities: Array.from(getPlanCapabilities(tier)),
    limits: {
      configuredProducts: finite(getPlanLimit(tier, "configuredProducts")),
      storefrontVariants: getPlanLimit(tier, "storefrontVariants"),
      metafieldColumns: getPlanLimit(tier, "metafieldColumns"),
    },
  };
}
function finite(value: number) {
  return Number.isFinite(value) ? value : null;
}
