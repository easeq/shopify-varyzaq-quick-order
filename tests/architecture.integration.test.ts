import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("reuses shared Shopify core instead of duplicating billing and queue infrastructure", async () => {
  const billing = await read("app/services/billing.server.ts");
  const queue = await read("app/queues/queue.server.ts");
  const packageJson = JSON.parse(await read("package.json"));
  assert.match(billing, /@app-platform\/shopify-core/);
  for (const name of ["buildQueueName", "createAppQueue", "getRuntimeIdentity"])
    assert.match(queue, new RegExp(`\\b${name}\\b`));
  assert.match(queue, /from "@app-platform\/shopify-core"/);
  assert.equal(packageJson.dependencies["@app-platform/shopify-core"], "workspace:*");
  assert.equal(
    packageJson.dependencies["@app-platform/shopify-admin-extension-core"],
    "workspace:*",
  );
  assert.equal(packageJson.dependencies["@app-platform/shopify-ui"], "workspace:*");
});

test("generalizes quantity rules for future MOQ/case-pack reuse", async () => {
  const packageJson = JSON.parse(await read("packages/quantity-rules/package.json"));
  const source = await read("packages/quantity-rules/src/index.ts");
  assert.equal(packageJson.name, "@app-platform/quantity-rules");
  assert.match(source, /minimum/);
  assert.match(source, /casePack/);
  assert.match(source, /resolveQuantityRule/);
});

test("does not create customer, cart, order-history or product mirror models", async () => {
  const schema = await read("prisma/schema.prisma");
  assert.match(schema, /model Session/);
  assert.match(schema, /refreshToken\s+String\?/);
  assert.match(schema, /model Subscription/);
  assert.doesNotMatch(schema, /model (Customer|Order|Cart|Product|Variant)\b/);
  assert.match(schema, /provider = "postgresql"/);
});
