import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("bulk add uses one Ajax Cart request with an items array", async () => {
  const js = await read("extensions/variant-quick-order-theme/assets/variant-quick-order.js");
  assert.match(js, /cart\/add\.js/);
  assert.match(js, /JSON\.stringify\(\{\s*items,/s);
  assert.doesNotMatch(js, /Number\(id\)/);
});

test("theme limits initial variant payload by plan and supports custom proxy path", async () => {
  const liquid = await read(
    "extensions/variant-quick-order-theme/blocks/variant-quick-order.liquid",
  );
  assert.match(liquid, /assign initial_limit = 50/);
  assert.match(liquid, /assign initial_limit = 250/);
  assert.match(liquid, /for variant in product\.variants limit: initial_limit/);
  assert.match(liquid, /product\.variants_count/);
  assert.match(liquid, /block\.settings\.proxy_path/);
  assert.doesNotMatch(liquid, /admin_graphql_api_id/);
});

test("Pro high-variant route uses bounded Storefront pages rather than oversized Admin connections", async () => {
  const route = await read("app/routes/apps.variant-quick-order.variants.ts");
  assert.match(route, /MAX_PAGE_SIZE = 100/);
  assert.match(route, /context\.storefront\.graphql/);
  assert.match(route, /variants\(first: \$first, after: \$after\)/);
  assert.match(route, /metafields\(identifiers: \$identifiers\)/);
  assert.match(route, /appRule: metafield\(key: "quick_order_rule"\)/);
  assert.doesNotMatch(route, /variants\(first:\s*2048/);
  assert.doesNotMatch(route, /context\.admin\.graphql[\s\S]*variants\(/);
});

test("B2B appended rows do not claim uncontextualized proxy prices", async () => {
  const js = await read("extensions/variant-quick-order-theme/assets/variant-quick-order.js");
  assert.match(js, /isB2B && variant\.source === "proxy"/);
  assert.match(js, /Calculated in cart/);
  assert.match(js, /canUseNative = !\(isB2B && variant\.source === "proxy"\)/);
});
