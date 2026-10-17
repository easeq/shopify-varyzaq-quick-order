/**
 * Admin GraphQL namespace token for app-owned metafields.
 *
 * Keep this string export for services that build Admin GraphQL mutations.
 * Shopify expands `$app` to the current app-reserved namespace.
 */
export const APP_OWNED_METAFIELD_NAMESPACE = "$app" as const;

/**
 * Shopify uses different namespace tokens for app-owned metafields depending
 * on the API surface.
 *
 * - Declarative TOML: `app`
 * - Admin GraphQL: `$app`
 * - Theme App Extension Liquid: `$app`
 */
export const APP_OWNED_METAFIELD_NAMESPACES = {
  toml: "app",
  graphql: APP_OWNED_METAFIELD_NAMESPACE,
  themeExtensionLiquid: "$app",
} as const;

/**
 * Shopify uses different names for the product-variant owner depending on the
 * API surface.
 *
 * - Declarative TOML: `product_variant`
 * - Admin GraphQL: `PRODUCTVARIANT`
 * - Liquid object: `variant`
 */
export const PRODUCT_VARIANT_OWNER = {
  toml: "product_variant",
  graphql: "PRODUCTVARIANT",
  liquid: "variant",
} as const;

/**
 * App-owned metaobject types are isolated by Shopify app identity, even when
 * multiple apps use the same logical type name.
 */
export function appOwnedMetaobjectType(type: string): string {
  const normalized = type.trim().replace(/^\$app:/, "");

  if (!normalized) {
    throw new Error("A non-empty app-owned metaobject type is required.");
  }

  return `$app:${normalized}`;
}

export interface AppOwnedMetafieldValueInput {
  ownerId: string;
  key: string;
  value: string;
  type?: string;
  compareDigest?: string | null;
}

/**
 * Builds a MetafieldsSetInput for app-owned resource metafields.
 *
 * Shopify's Admin API selects the current app-reserved namespace when
 * `namespace` is omitted. Keep `$app` for definition/query surfaces; do not
 * inject it into MetafieldsSetInput.
 */
export function appOwnedMetafieldValueInput(
  input: AppOwnedMetafieldValueInput,
): AppOwnedMetafieldValueInput {
  return { ...input };
}
