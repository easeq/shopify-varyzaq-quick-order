import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Starter is normal unlimited product usage and Pro owns advanced workflows", async () => {
  const source = await read("app/config/billing.config.ts");
  assert.match(
    source,
    /tier: "starter"[\s\S]*configuredProducts: Number\.POSITIVE_INFINITY[\s\S]*storefrontVariants: 250/,
  );
  assert.match(source, /tier: "pro"[\s\S]*CSV_PASTE[\s\S]*LARGE_VARIANT_SETS[\s\S]*B2B_CONTROLS/);
  assert.match(source, /storefrontVariants: 2048/);
  assert.match(source, /metafieldColumns: 8/);
});

test("storefront settings include visible columns, labels, sorting, mobile and quantity controls", async () => {
  const source = await read("app/config/quick-order.config.ts");
  for (const token of [
    "columnLabels",
    "visibleColumns",
    "sortBy",
    "sortDirection",
    "mobileLayout",
    "defaultRule",
    "metafieldColumns",
    "requireB2BCompany",
  ]) {
    assert.match(source, new RegExp(token));
  }
});
