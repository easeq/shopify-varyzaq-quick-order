import assert from "node:assert/strict";
import test from "node:test";
import { normalizeOrderQuantity, normalizeQuantityRule, resolveQuantityRule, validateOrderQuantity } from "../src/index.ts";

test("normalizes minimum and maximum to the increment", () => {
  assert.deepEqual(normalizeQuantityRule({ minimum: 7, maximum: 24, increment: 5, casePack: 10 }), {
    minimum: 10, maximum: 20, increment: 5, casePack: 10,
  });
});
test("prefers native Shopify B2B rules", () => {
  assert.equal(resolveQuantityRule({ shopify: { minimum: 6, increment: 3 }, app: { minimum: 10 } }).source, "shopify");
});
test("normalizes entered order quantities", () => {
  assert.equal(normalizeOrderQuantity(7, { minimum: 5, increment: 5 }), 10);
  assert.equal(validateOrderQuantity(7, { minimum: 5, increment: 5 }), "Quantity must be in increments of 5.");
});
