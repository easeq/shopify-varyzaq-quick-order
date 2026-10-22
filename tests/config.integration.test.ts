import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
for (const environment of ["development", "staging", "production"]) {
  test(`${environment} config is isolated and has required scopes/webhooks/proxy`, async () => {
    const source = await read(`shopify.app.variant-quick-order-${environment}.toml`);
    assert.match(source, /read_products,write_products,write_app_proxy/);
    assert.match(source, /\[app_proxy\]/);
    assert.match(source, /customers\/data_request/);
    assert.match(source, /app\/scopes_update/);
    assert.match(source, /quick_order_configured/);
  });
}

test("database boundary is environment-specific Postgres", async () => {
  const source = await read("app/db.server.ts");
  assert.match(source, /variant_quick_order_\$\{appEnvironment\}/);
  const schema = await read("prisma/schema.prisma");
  assert.match(schema, /provider = "postgresql"/);
});
