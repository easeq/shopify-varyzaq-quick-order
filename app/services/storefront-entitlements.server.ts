import { getPlanCapabilities, type Tier } from "../config/billing.config";
import { unauthenticated } from "../shopify.server";

export const APP_DATA_NAMESPACE = "variant_quick_order";
export const PLAN_KEY = "plan";
export const CAPABILITIES_KEY = "capabilities";

export async function syncStorefrontEntitlements(params: { shop: string; plan: Tier }) {
  const { admin } = await unauthenticated.admin(params.shop);
  const ownerId = await currentAppInstallationId(admin);
  const response = await admin.graphql(
    `#graphql
    mutation SyncQuickOrderEntitlements($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { userErrors { message } }
    }`,
    {
      variables: {
        metafields: [
          {
            ownerId,
            namespace: APP_DATA_NAMESPACE,
            key: PLAN_KEY,
            type: "single_line_text_field",
            value: params.plan,
          },
          {
            ownerId,
            namespace: APP_DATA_NAMESPACE,
            key: CAPABILITIES_KEY,
            type: "single_line_text_field",
            value: Array.from(getPlanCapabilities(params.plan)).join(","),
          },
        ],
      },
    },
  );
  const json = (await response.json()) as any;
  const errors = json.errors ?? json.data?.metafieldsSet?.userErrors ?? [];
  if (!response.ok || errors.length)
    throw new Error(
      errors
        .map((e: any) => e.message)
        .filter(Boolean)
        .join("; ") || "Could not sync storefront entitlements.",
    );
}

async function currentAppInstallationId(admin: {
  graphql(query: string, options?: { variables?: Record<string, unknown> }): Promise<Response>;
}) {
  const response = await admin.graphql(
    `#graphql query CurrentQuickOrderInstallation { currentAppInstallation { id } }`,
  );
  const json = (await response.json()) as any;
  const id = json.data?.currentAppInstallation?.id;
  if (!id) throw new Error("Could not resolve current AppInstallation.");
  return id as string;
}
