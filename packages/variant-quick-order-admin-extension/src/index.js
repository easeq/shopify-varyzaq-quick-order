import {
  adminGraphql,
  appBackendJson,
  appOwnedMetafieldValue,
  setAppOwnedMetafields,
} from "../../shopify-admin-extension-core/src/index.js";
export const PRODUCT_CONFIG_KEY = "quick_order_config";
export const CONFIGURED_KEY = "quick_order_configured";
export const VARIANT_RULE_KEY = "quick_order_rule";
export const ENTITLEMENTS_URL = "/admin-extension/quick-order";
export const DEFAULT_PRODUCT_CONFIG = Object.freeze({
  version: 1,
  enabled: true,
  heading: "",
  sortBy: "global",
  hideSoldOut: "global",
});
export const DEFAULT_RULE = Object.freeze({
  minimum: 1,
  maximum: null,
  increment: 1,
  casePack: null,
});

export async function loadEntitlements() {
  const value = await appBackendJson(ENTITLEMENTS_URL);
  return { ...value, capabilities: new Set(value.capabilities ?? []) };
}
export async function loadProductQuickOrder(productId) {
  const [data, entitlements] = await Promise.all([
    adminGraphql(
      `#graphql query ProductQuickOrder($id: ID!) { product(id: $id) { id title variantsCount { count } configured: metafield(key: "${CONFIGURED_KEY}") { value } config: metafield(key: "${PRODUCT_CONFIG_KEY}") { value } } }`,
      { id: productId },
    ),
    loadEntitlements(),
  ]);
  const product = data.product;
  if (!product) throw new Error("Product not found.");
  const config = normalizeProductConfig(parseJson(product.config?.value));
  return { product, config, isConfigured: product.configured?.value === "true", ...entitlements };
}
export async function saveProductQuickOrder(productId, config) {
  const normalized = normalizeProductConfig(config);
  return setAppOwnedMetafields([
    appOwnedMetafieldValue({
      ownerId: productId,
      key: PRODUCT_CONFIG_KEY,
      type: "json",
      value: JSON.stringify(normalized),
    }),
    appOwnedMetafieldValue({
      ownerId: productId,
      key: CONFIGURED_KEY,
      type: "boolean",
      value: normalized.enabled ? "true" : "false",
    }),
  ]);
}
export async function loadVariantQuickOrder(variantId) {
  const [data, entitlements] = await Promise.all([
    adminGraphql(
      `#graphql query VariantQuickOrder($id: ID!) { productVariant(id: $id) { id title sku product { title } rule: metafield(key: "${VARIANT_RULE_KEY}") { value } } }`,
      { id: variantId },
    ),
    loadEntitlements(),
  ]);
  const variant = data.productVariant;
  if (!variant) throw new Error("Variant not found.");
  return { variant, rule: normalizeRule(parseJson(variant.rule?.value)), ...entitlements };
}
export async function saveVariantQuickOrder(variantId, rule) {
  return setAppOwnedMetafields([
    appOwnedMetafieldValue({
      ownerId: variantId,
      key: VARIANT_RULE_KEY,
      type: "json",
      value: JSON.stringify(normalizeRule(rule)),
    }),
  ]);
}
export function normalizeProductConfig(value) {
  const source = record(value);
  return {
    version: 1,
    enabled: source.enabled !== false,
    heading: text(source.heading, "", 80),
    sortBy: ["global", "position", "title", "sku"].includes(source.sortBy)
      ? source.sortBy
      : "global",
    hideSoldOut: ["global", "show", "hide"].includes(source.hideSoldOut)
      ? source.hideSoldOut
      : "global",
  };
}
export function normalizeRule(value) {
  const source = record(value);
  const increment = positive(source.increment, 1);
  let minimum = positive(source.minimum, increment);
  minimum = Math.ceil(minimum / increment) * increment;
  let maximum = optional(source.maximum);
  if (maximum != null) {
    maximum = Math.max(minimum, Math.floor(maximum / increment) * increment);
  }
  return { minimum, maximum, increment, casePack: optional(source.casePack) };
}
function parseJson(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function positive(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
function optional(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}
function text(value, fallback, max) {
  const v = typeof value === "string" ? value.trim() : "";
  return (v || fallback).slice(0, max);
}
