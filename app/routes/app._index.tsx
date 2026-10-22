import { useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { PLAN_CATALOG, type Tier } from "../config/billing.config";
import { getThemeEditorUrl } from "../helpers/theme-editor.server";
import { ensureBilling, getSubscription, isSubscriptionStale } from "../services/billing.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  let subscription = await getSubscription(session.shop);
  if (
    !subscription ||
    isSubscriptionStale(
      subscription.updatedAtShopify,
      Number(process.env.ADMIN_ENTITLEMENT_MAX_AGE_HOURS ?? 24),
    )
  ) {
    if (!session.accessToken) throw new Error("Missing Shopify Admin access token.");
    const billing = await ensureBilling({
      shop: session.shop,
      adminAccessToken: session.accessToken,
    });
    if (billing.redirectUrl)
      return {
        redirectUrl: billing.redirectUrl,
        tier: "free" as Tier,
        themeEditorUrl: getThemeEditorUrl({ shop: session.shop }),
      };
    subscription = billing.subscription;
  }
  const tier: Tier =
    subscription?.status === "active"
      ? (PLAN_CATALOG.normalizeHandle(subscription.plan) ??
        (PLAN_CATALOG.order.includes(subscription.plan as Tier)
          ? (subscription.plan as Tier)
          : "free"))
      : "free";
  return { redirectUrl: null, tier, themeEditorUrl: getThemeEditorUrl({ shop: session.shop }) };
}
export default function Home() {
  const data = useLoaderData<typeof loader>();
  useEffect(() => {
    if (data.redirectUrl) window.open(data.redirectUrl, "_top");
  }, [data.redirectUrl]);
  if (data.redirectUrl)
    return (
      <s-page heading="Choose a plan">
        <s-section>
          <s-banner tone="info">Choose a Shopify App Pricing plan to continue.</s-banner>
          <s-button variant="primary" target="_top" href={data.redirectUrl}>
            View plans
          </s-button>
        </s-section>
      </s-page>
    );
  return (
    <s-page heading="Variant Quick Order">
      <s-button
        slot="primary-action"
        variant="primary"
        href="shopify://admin/products"
        target="_top"
      >
        Configure products
      </s-button>
      <s-button slot="secondary-actions" href={data.themeEditorUrl} target="_top">
        Add to theme
      </s-button>
      <s-section heading="Bulk ordering on product pages">
        <s-stack gap="base">
          <s-banner tone="success">{PLAN_CATALOG.plans[data.tier].displayName} plan</s-banner>
          <s-paragraph>
            Enable Quick Order from a product’s Shopify Admin app block, then add the theme block to
            product templates. Buyers can enter quantities across variants and add all selected
            lines to cart in one request.
          </s-paragraph>
          <s-paragraph>
            Starter is intended for normal unlimited product usage. Pro adds CSV paste, advanced
            columns, native B2B-oriented controls, variant-level rule overrides, and the paged
            high-variant loader for products beyond 250 variants.
          </s-paragraph>
          <s-stack direction="inline" gap="base">
            <s-button variant="primary" href="shopify://admin/products" target="_top">
              Open products
            </s-button>
            <s-button href="/app/settings">Configure storefront</s-button>
          </s-stack>
        </s-stack>
      </s-section>
    </s-page>
  );
}
