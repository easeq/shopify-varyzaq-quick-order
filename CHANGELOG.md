# Changelog

## 0.1.1 — 2026-10-23

- Added `sample.env` (mirrors the MezuraWise Flooring layout; worker/billing vars trimmed to what this app reads).
- Restyled marketing assets to the shared Zerqith style: new framed app icon, six banners plus featured media, gallery with in-browser PNG export.
- `package.json` now follows the Flooring Calculator layout, matches `pnpm-lock.yaml` again, and drops unused scripts.
- Fixed Shopify config names, app-proxy subpath/url, missing Prisma migration, stale tests and README/docs references.

## 0.1.0 — 2026-09-17

- Added the production-ready Variant Quick Order / Bulk Add Table Shopify app.
- Reused the shared Shopify core for billing, entitlements, app-owned custom data, queues, runtime identity and deployment conventions.
- Reused the shared Admin UI extension core and BillingPanel UI package.
- Added a generalized `@app-platform/quantity-rules` package for native Shopify quantity-rule + app fallback interoperability and future MOQ/case-pack reuse.
- Added product and variant Admin UI blocks, Theme App Extension, one-request multi-variant cart add, mobile cards, merchant-defined labels/sorting, selected metafield columns and quantity rules.
- Added Pro CSV/paste, B2B controls, variant rule overrides and high-variant app-proxy paging up to Shopify's 2,048-variant product limit.
- Added development/staging/production config isolation, PostgreSQL-only Prisma storage with refresh tokens, BullMQ subscription/webhook workers, Docker examples, marketing assets, Remotion promo source and App Store submission material.
