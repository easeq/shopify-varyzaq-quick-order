export function buildShopifyPricingUrl(params: { shop: string; appHandle: string }): string {
  const { shop, appHandle } = params;
  const storeHandle = shop.replace(/\.myshopify\.com$/i, "");

  if (!storeHandle) {
    throw new Error("A valid Shopify shop domain is required to build the pricing URL.");
  }

  if (!appHandle) {
    throw new Error("APP_HANDLE is required to build the Shopify pricing URL.");
  }

  return `https://admin.shopify.com/store/${encodeURIComponent(
    storeHandle,
  )}/charges/${encodeURIComponent(appHandle)}/pricing_plans`;
}
