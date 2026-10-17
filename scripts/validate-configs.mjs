import { readFile, readdir } from "node:fs/promises";
const environments = ["development", "staging", "production"];
const rootFiles = await readdir(new URL("../", import.meta.url));
let failed = false;
for (const environment of environments) {
  const name = `shopify.app.variant-quick-order-${environment}.toml`;
  if (!rootFiles.includes(name)) { console.error(`Missing ${name}`); failed = true; continue; }
  const source = await readFile(new URL(`../${name}`, import.meta.url), "utf8");
  const required = [
    'scopes = "read_products,write_products,write_app_proxy"',
    '[app_proxy]',
    'url = "/apps/variant-quick-order"',
    'subpath = "variant-quick-order"',
    '[product.metafields.app.quick_order_config]',
    '[product.metafields.app.quick_order_configured]',
    'capabilities.admin_filterable = true',
    'customers/data_request',
    'customers/redact',
    'shop/redact',
  ];
  for (const token of required) if (!source.includes(token)) { console.error(`${name}: missing ${token}`); failed = true; }
  if (source.includes("[product_variant.metafields")) { console.error(`${name}: ProductVariant definitions must remain runtime-managed for CLI compatibility.`); failed = true; }
  if (source.includes("material_calculator") || source.includes("CALCULATOR_APP")) { console.error(`${name}: contains Material Calculator-specific config.`); failed = true; }
}
const theme = await readFile(new URL("../extensions/variant-quick-order-theme/blocks/variant-quick-order.liquid", import.meta.url), "utf8");
if (!theme.includes('data-proxy-path="{{ block.settings.proxy_path')) { console.error("Theme block must support customized app-proxy paths."); failed = true; }
if (failed) process.exit(1);
console.log("Validated Variant Quick Order Shopify configs and proxy/theme contract.");
