# Architecture and reuse decisions

## Reused from the supplied Shopify platform

- `@app-platform/shopify-core`: plan catalog/billing manager, Partner API billing client, app-owned metafield definition helpers, GDPR contracts, Redis/BullMQ queue and worker factories, worker role parsing, runtime identity, env helpers and PostgreSQL boundary enforcement.
- `@app-platform/shopify-admin-extension-core`: Admin Direct GraphQL wrapper, app-backend JSON fetches, selected resource IDs and app-owned metafield writes.
- `@app-platform/shopify-ui`: shared `BillingPanel`.
- Material Calculator patterns: Product/ProductVariant Admin blocks, app-data entitlement snapshots, declarative Product app-owned metafields, runtime ProductVariant definition provisioning, three Shopify identities/configs, PostgreSQL Prisma sessions with refresh tokens, BullMQ subscription/webhook processing, Docker/Dokploy layout, HTML marketing banners and Remotion source.

## New reusable module

`@app-platform/quantity-rules` is cross-app infrastructure, not Quick Order-specific code. It normalizes and validates minimum, maximum, increment and case-pack values and exposes a resolution primitive suitable for a future MOQ/case-pack product.

## App-owned data

Product:

- `$app.quick_order_config` JSON
- `$app.quick_order_configured` Boolean/filter flag

ProductVariant:

- `$app.quick_order_rule` JSON, provisioned idempotently at runtime with merchant read + storefront public read.

AppInstallation:

- `variant_quick_order.plan`
- `variant_quick_order.capabilities`
- `variant_quick_order.storefront_settings`

PostgreSQL stores Shopify sessions and subscription cache only.

## Storefront

The Theme App Extension serializes the initial context-aware Liquid variant rows. JavaScript renders the configured table/cards and calls Shopify Ajax Cart with one multi-item request. Pro products beyond the Liquid ceiling page through one authenticated app-proxy route.

## Why no product table inside the embedded app

As in the mature Material Calculator implementation, product-specific editing belongs on Shopify product/variant pages. Duplicating a product browser would add pagination/query cost and a second merchant workflow with little value. The embedded app owns global storefront configuration and billing.
