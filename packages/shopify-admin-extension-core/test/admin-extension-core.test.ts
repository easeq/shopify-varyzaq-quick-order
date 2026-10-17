import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_GRAPHQL_URL,
  ADMIN_UI_BLOCK_TARGETS,
  appOwnedMetafieldValue,
  capabilitySet,
} from "../src/index.js";

test("admin extension targets use current product detail block targets", () => {
  assert.equal(ADMIN_UI_BLOCK_TARGETS.product, "admin.product-details.block.render");
  assert.equal(ADMIN_UI_BLOCK_TARGETS.productVariant, "admin.product-variant-details.block.render");
  assert.equal(ADMIN_GRAPHQL_URL, "shopify:admin/api/graphql.json");
});

test("app-owned value input intentionally omits namespace", () => {
  const input = appOwnedMetafieldValue({
    ownerId: "gid://shopify/Product/1",
    key: "example",
    type: "json",
    value: "{}",
  });

  assert.equal("namespace" in input, false);
});

test("capabilitySet parses cached capability CSV", () => {
  const values = capabilitySet("calculator, presets,variant_overrides");
  assert.equal(values.has("presets"), true);
  assert.equal(values.has("variant_overrides"), true);
});
