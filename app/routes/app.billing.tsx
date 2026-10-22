import { buildShopifyPricingUrl } from "@app-platform/shopify-core";
import { BillingPanel } from "@app-platform/shopify-ui";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { PLAN_CATALOG, type Tier } from "../config/billing.config";
import { ensureBilling } from "../services/billing.server";
import { authenticate } from "../shopify.server";
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  if (!session.accessToken) throw new Error("Missing Shopify Admin access token.");
  const result = await ensureBilling({ shop: session.shop, adminAccessToken: session.accessToken });
  const tier: Tier =
    result.subscription?.status === "active"
      ? (PLAN_CATALOG.normalizeHandle(result.subscription.plan) ??
        (PLAN_CATALOG.order.includes(result.subscription.plan as Tier)
          ? (result.subscription.plan as Tier)
          : "free"))
      : "free";
  return {
    subscription: result.subscription,
    shopifySubscription: result.shopifySubscription,
    billingUrl:
      result.redirectUrl ??
      buildShopifyPricingUrl({ shop: session.shop, appHandle: process.env.APP_HANDLE ?? "" }),
    displayName: PLAN_CATALOG.plans[tier].displayName,
  };
}
export default function Billing() {
  const data = useLoaderData<typeof loader>();
  const item = data.shopifySubscription?.items.find((x) => x.price.active);
  return (
    <s-page heading="Billing">
      <BillingPanel
        status={data.subscription?.status}
        displayName={data.displayName}
        activeDescription={item?.description}
        billingUrl={data.billingUrl}
        currentPeriodEnd={data.subscription?.currentPeriodEnd}
      />
    </s-page>
  );
}
