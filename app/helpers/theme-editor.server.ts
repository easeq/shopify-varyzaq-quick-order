export function getThemeEditorUrl(params: { shop: string }) {
  const apiKey = process.env.SHOPIFY_API_KEY ?? "";
  if (!apiKey) throw new Error("SHOPIFY_API_KEY is required.");
  const url = new URL(`https://${params.shop}/admin/themes/current/editor`);
  url.searchParams.set("template", "product");
  url.searchParams.set(
    "addAppBlockId",
    `${apiKey}/${process.env.SHOPIFY_THEME_BLOCK_HANDLE ?? "variant-quick-order"}`,
  );
  url.searchParams.set("target", "newAppsSection");
  return url.toString();
}
