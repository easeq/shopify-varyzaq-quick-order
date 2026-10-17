# @app-platform/shopify-core

Reusable server-side foundation for Shopify apps in this repository family.

The package intentionally contains no calculator domain model and no Prisma dependency. Each app supplies its own Shopify App Pricing tiers, capabilities, persistence adapter, custom-data schema, webhook side effects, and domain jobs.

## Included primitives

- ordered plan/capability catalogs with one live Shopify App Pricing handle per tier;
- automatic private boundary-test handle `${liveHandle}-test` for every tier;
- cumulative capabilities and app-defined quantitative limits;
- Shopify App Pricing verification through Partner API `activeSubscription`;
- persistence-agnostic billing manager and subscription staleness helpers;
- exact live/test handle resolution so test subscriptions exercise the same capability boundary as their live tier;
- Shopify-hosted pricing URL generation;
- Redis/BullMQ queue, worker, cron-scheduler, role parsing, and graceful-shutdown helpers;
- deterministic app/environment queue names using `APP_HANDLE__APP_ENV__role` (no colons);
- PostgreSQL database-boundary validation that rejects shared-schema multiplexing;
- GDPR topic/payload helpers that intentionally strip names/emails before queueing;
- app-owned metafield/metaobject namespace helpers, including `metafieldsSet` inputs that intentionally omit `namespace` so Shopify selects the current app-reserved namespace;
- required environment-variable helpers.

## Plan definition

A plan has one application handle even when Shopify offers monthly and yearly billing options for that plan. The framework derives the private boundary-test handle automatically:

```ts
const plans = createPlanCatalog({
  order: ["free", "starter", "pro"],
  definitions: [
    {
      tier: "starter",
      displayName: "Starter",
      handle: "starter",
      capabilityAdditions: ["variant_overrides"],
      limits: { products: 100 },
    },
  ],
});

plans.liveHandleFor("starter"); // starter
plans.testHandleFor("starter"); // starter-test
```

Create the matching `starter-test` plan in Shopify App Pricing as a private $0 plan for the stores used to test Starter boundaries. Do the same for every tier instead of mapping one catch-all private test plan to the highest tier.

## Minimal billing integration

```ts
import {
  PartnerBillingClient,
  createBillingManager,
  createPlanCatalog,
} from "@app-platform/shopify-core";

const plans = createPlanCatalog({
  order: ["free", "pro"],
  definitions: [
    // App-specific plan definitions.
  ],
});

const billing = createBillingManager({
  plans,
  persistence: mySubscriptionPersistence,
  client: new PartnerBillingClient(partnerApiOptions),
  appHandle: process.env.APP_HANDLE!,
  fallbackTier: "free",
});
```

## Isolation rules

- **Database:** each app/environment gets a complete PostgreSQL database. Apps may share the same PostgreSQL server, never the same database/schema.
- **BullMQ:** every queue name must be built from `APP_HANDLE__APP_ENV__role`.
- **Shopify custom data:** use app-owned `$app` metafield definitions/queries and `$app:<type>` metaobjects. For `metafieldsSet`, build inputs with `appOwnedMetafieldValueInput()` so the namespace is omitted and Shopify selects the current app-reserved namespace. Shopify scopes these values to the owning app identity.
- **Jobs:** use separate queue roles for unrelated workloads when they have different rate limits, scaling needs, or failure domains. `parseWorkerRoles()` and `installWorkerShutdown()` keep multi-worker bootstraps consistent across apps.

See `/docs/10-generic-framework.md` in the complete app repository for the full integration model.
