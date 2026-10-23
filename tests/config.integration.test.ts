import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
for (const [environment, configName] of [
  ["development", "varyzaq-quick-order-dev"],
  ["staging", "varyzaq-quick-order-staging"],
  ["production", "varyzaq-quick-order"],
]) {
  test(`${environment} config is isolated and has required scopes/webhooks/proxy`, async () => {
    const source = await read(`shopify.app.${configName}.toml`);
    assert.match(source, /read_products,write_products,write_app_proxy/);
    assert.match(source, /\[app_proxy\]/);
    assert.match(source, /customers\/data_request/);
    assert.match(source, /app\/scopes_update/);
    assert.match(source, /quick_order_configured/);
  });
}

test("database is PostgreSQL via DATABASE_URL", async () => {
  const schema = await read("prisma/schema.prisma");
  assert.match(schema, /provider = "postgresql"/);
  assert.match(schema, /url\s*=\s*env\("DATABASE_URL"\)/);
});
