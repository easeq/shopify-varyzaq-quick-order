import assert from "node:assert/strict";
import test from "node:test";
import { assertPostgresDatabaseBoundary } from "../src/runtime/database.ts";
import {
  APP_OWNED_METAFIELD_NAMESPACES,
  PRODUCT_VARIANT_OWNER,
  appOwnedMetafieldValueInput,
  appOwnedMetaobjectType,
} from "../src/shopify/custom-data.ts";
import { parseWorkerRoles, waitForWorkersReady } from "../src/queues/roles.ts";
import {
  buildQueueName,
  getRuntimeIdentity,
  requireEnvironmentVariable,
} from "../src/runtime/environment.ts";

test("runtime identity and queue names are deterministic", () => {
  const env = {
    APP_HANDLE: "tile-calculator",
    APP_ENV: "staging",
  } as NodeJS.ProcessEnv;

  const identity = getRuntimeIdentity(env);

  assert.deepEqual(identity, {
    appHandle: "tile-calculator",
    environment: "staging",
  });
  assert.equal(
    buildQueueName(identity, "subscriptions"),
    "tile-calculator__staging__subscriptions",
  );
  assert.throws(() => buildQueueName(identity, "subscriptions:priority"), /cannot contain ":"/);
  assert.throws(
    () =>
      buildQueueName({ appHandle: "tile__calculator", environment: "staging" }, "subscriptions"),
    /reserved as the queue boundary separator/,
  );
});

test("database boundary rejects schemas and wrong app/environment databases", () => {
  assert.deepEqual(
    assertPostgresDatabaseBoundary({
      databaseUrl: "postgresql://postgres:postgres@localhost:5432/tile_staging",
      expectedDatabaseName: "tile_staging",
    }),
    {
      databaseName: "tile_staging",
      expectedDatabaseName: "tile_staging",
    },
  );

  assert.throws(
    () =>
      assertPostgresDatabaseBoundary({
        databaseUrl: "postgresql://postgres:postgres@localhost:5432/shared?schema=tile_staging",
        expectedDatabaseName: "tile_staging",
      }),
    /must not use \?schema=/,
  );

  assert.throws(
    () =>
      assertPostgresDatabaseBoundary({
        databaseUrl: "postgresql://postgres:postgres@localhost:5432/tile_production",
        expectedDatabaseName: "tile_staging",
      }),
    /Database isolation violation/,
  );
});

test("required environment variables fail clearly", () => {
  assert.throws(() => requireEnvironmentVariable("APP_HANDLE", {}), /APP_HANDLE is required/);
});

test("app-owned metaobject helper always uses Shopify's reserved app namespace", () => {
  assert.equal(appOwnedMetaobjectType("calculator_preset"), "$app:calculator_preset");
  assert.equal(appOwnedMetaobjectType("$app:calculator_preset"), "$app:calculator_preset");
  assert.throws(() => appOwnedMetaobjectType(""), /non-empty/);
});

test("app-owned metafield value inputs omit the reserved namespace token", () => {
  const input = appOwnedMetafieldValueInput({
    ownerId: "gid://shopify/Product/1",
    key: "configuration",
    value: "{}",
  });

  assert.equal("namespace" in input, false);
});

test("app-owned metafield namespace names match each Shopify surface", () => {
  assert.deepEqual(APP_OWNED_METAFIELD_NAMESPACES, {
    toml: "app",
    graphql: "$app",
    themeExtensionLiquid: "$app",
  });
});

test("product variant owner names match each Shopify surface", () => {
  assert.deepEqual(PRODUCT_VARIANT_OWNER, {
    toml: "product_variant",
    graphql: "PRODUCTVARIANT",
    liquid: "variant",
  });
});

test("worker role parser isolates responsibilities and rejects unknown roles", () => {
  const roles = ["subscriptions", "webhooks", "sync", "batch"] as const;

  assert.deepEqual(parseWorkerRoles({ availableRoles: roles, value: "subscriptions,webhooks" }), [
    "subscriptions",
    "webhooks",
  ]);
  assert.deepEqual(parseWorkerRoles({ availableRoles: roles, value: "all" }), roles);
  assert.throws(
    () =>
      parseWorkerRoles({
        availableRoles: roles,
        value: "subscriptions,unknown",
      }),
    /Unknown worker role/,
  );
});

test("worker readiness helper closes workers after a startup timeout", async () => {
  let closed = false;
  const worker = {
    waitUntilReady: () => new Promise<void>(() => undefined),
    close: async () => {
      closed = true;
    },
  };

  await assert.rejects(
    () =>
      waitForWorkersReady({
        workers: [worker as never],
        timeoutMs: 5,
      }),
    /did not become ready/,
  );

  assert.equal(closed, true);
});
