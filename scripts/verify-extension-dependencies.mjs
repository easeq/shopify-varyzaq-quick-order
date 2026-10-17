import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
const failures = [];
for (const specifier of ["preact", "preact/hooks", "@shopify/ui-extensions/preact"]) {
  try { require.resolve(specifier); } catch { failures.push(`Cannot resolve ${specifier}`); }
}
for (const file of ["packages/shopify-admin-extension-core/src/index.js", "packages/variant-quick-order-admin-extension/src/index.js"]) {
  if (!existsSync(resolve(process.cwd(), file))) failures.push(`Missing ${file}`);
}
if (failures.length) { for (const failure of failures) console.error(failure); process.exit(1); }
console.log("Admin UI extension dependencies resolved.");
