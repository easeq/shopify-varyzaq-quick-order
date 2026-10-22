import { ensureAppOwnedMetafieldDefinition } from "@app-platform/shopify-core";

const ensured = new Set<string>();
export const VARIANT_RULE_KEY = "quick_order_rule";
export async function ensureVariantRuleDefinition(params: { admin: any; shop: string }) {
  if (ensured.has(params.shop)) return;
  await ensureAppOwnedMetafieldDefinition({
    admin: params.admin,
    definition: {
      name: "Quick order quantity rule override",
      description:
        "Optional variant-level minimum, maximum, increment and case-pack values used by Variant Quick Order.",
      namespace: "$app",
      key: VARIANT_RULE_KEY,
      type: "json",
      ownerType: "PRODUCTVARIANT",
      access: { admin: "MERCHANT_READ", storefront: "PUBLIC_READ" },
    },
  });
  ensured.add(params.shop);
}
