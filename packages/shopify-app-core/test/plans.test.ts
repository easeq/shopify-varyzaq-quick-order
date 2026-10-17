import assert from "node:assert/strict";
import test from "node:test";
import { createPlanCatalog } from "../src/billing/plans.ts";
import { isSubscriptionStale } from "../src/billing/staleness.ts";

test("plan catalog derives one -test handle for every live plan", () => {
  const catalog = createPlanCatalog({
    order: ["free", "starter", "pro"] as const,
    definitions: [
      {
        tier: "free",
        displayName: "Free",
        handle: "free",
        capabilityAdditions: ["base"] as const,
        limits: { records: 10 },
      },
      {
        tier: "starter",
        displayName: "Starter",
        handle: "starter",
        capabilityAdditions: ["labels"] as const,
        limits: { records: 100 },
      },
      {
        tier: "pro",
        displayName: "Pro",
        handle: "pro",
        capabilityAdditions: ["presets"] as const,
        limits: { records: Number.POSITIVE_INFINITY },
      },
    ],
  });

  assert.deepEqual(catalog.allHandles, [
    "free",
    "free-test",
    "starter",
    "starter-test",
    "pro",
    "pro-test",
  ]);
  assert.deepEqual(catalog.resolveHandle("starter-test"), {
    tier: "starter",
    handle: "starter-test",
    liveHandle: "starter",
    testHandle: "starter-test",
    isTest: true,
  });
  assert.equal(catalog.normalizeHandle("pro"), "pro");
  assert.equal(catalog.normalizeHandle("pro-test"), "pro");
  assert.equal(catalog.normalizeHandle("unknown"), null);
  assert.equal(catalog.hasCapability("pro", "base"), true);
  assert.equal(catalog.hasCapability("free", "presets"), false);
  assert.equal(catalog.minimumTierFor("presets"), "pro");
});

test("live plan handles cannot masquerade as test handles", () => {
  assert.throws(
    () =>
      createPlanCatalog({
        order: ["pro"] as const,
        definitions: [
          {
            tier: "pro",
            displayName: "Pro",
            handle: "pro-test",
            capabilityAdditions: ["feature"] as const,
            limits: { records: 1 },
          },
        ],
      }),
    /must not end in -test/,
  );
});

test("subscription staleness uses the Shopify verification timestamp", () => {
  const now = new Date("2026-09-01T00:00:00.000Z");

  assert.equal(isSubscriptionStale("2026-08-31T12:01:00.000Z", 24, now), false);
  assert.equal(isSubscriptionStale("2026-08-30T23:59:00.000Z", 24, now), true);
  assert.equal(isSubscriptionStale(null, 24, now), true);
});
