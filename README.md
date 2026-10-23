# Variant Quick Order / Bulk Add Table

Production-ready Shopify app for B2B, wholesale and option-heavy products. It renders a theme-native product-page table (or compact mobile cards) where buyers enter quantities for multiple variants and add all selected lines to cart in one action.

This repository was implemented against the supplied Material Calculator platform. Shared Shopify infrastructure is reused rather than copied: billing/plan catalogs, Partner API billing checks, app-owned metafield helpers, GDPR helpers, BullMQ factories/runtime identity, Admin UI extension helpers, the shared billing UI, PostgreSQL session storage and environment/deployment conventions.

## Product behavior

- Product Admin block enables/disables Quick Order and allows product heading/sort/sold-out overrides.
- Variant Admin block adds Pro fallback minimum/maximum/increment/case-pack rules.
- Theme App Extension supports option values, SKU, barcode, price, inventory, case/pack, quantity-rule, selected variant metafields and quantity inputs.
- Buyers can add many variants with one Shopify Ajax Cart `cart/add.js` request.
- Starter provides normal unlimited configured-product usage, standard columns, labels, sorting, mobile layouts and global fallback quantity rules.
- Pro adds CSV/Excel-style paste, search, barcode/case/rule/metafield columns, B2B visibility controls, variant rule overrides, branding removal and variant paging above Liquid's first 250 variants up to 2,048.
- No customer-profile or order-history database is created.

## Shared quantity-rule module

`packages/quantity-rules` is intentionally generic. It owns minimum/maximum/increment/case-pack normalization and validation so a future MOQ/case-pack app can consume the same semantics instead of duplicating them. Storefront resolution prefers meaningful native Shopify quantity rules when configured, then app variant overrides, then global fallback values.

## High-variant strategy

Liquid returns at most 250 unpaginated product variants. Free renders 50 and Starter renders 250 directly from Liquid. Pro starts with 250 context-aware Liquid rows, then uses the authenticated app proxy in pages of at most 100 until the product count or 2,048-plan ceiling is reached.

The proxy queries only fields needed by configured columns and no Admin API query requests a large variant connection. The tiny Admin query used to read app-installation settings is separate from the Storefront variant page query. This keeps Admin GraphQL work comfortably below Shopify's 1,000-point single-query maximum and avoids a monolithic `variants(first: 2048)` Admin query.

For a Shopify B2B customer, the first 250 Liquid variants use the current customer/company context. The app-proxy Storefront query can preserve market/country context but cannot synthesize the customer's Storefront BuyerInput without a Customer Access Token. For appended B2B rows the UI therefore says `Calculated in cart` rather than presenting a potentially wrong customer-specific price; native B2B quantity rules are not falsely inferred for those appended rows. Merchant/app fallback quantity rules remain available.

## Plans

| Capability                                           | Free  | Starter   | Pro         |
| ---------------------------------------------------- | ----- | --------- | ----------- |
| Configured products                                  | 3     | Unlimited | Unlimited   |
| Variant rows per product                             | 50    | 250       | Up to 2,048 |
| Standard option/SKU/price/inventory/quantity columns | Yes   | Yes       | Yes         |
| Custom labels, sorting, mobile layout                | Basic | Yes       | Yes         |
| Global fallback quantity defaults                    | No    | Yes       | Yes         |
| Barcode, case/pack, quantity-rule columns            | No    | No        | Yes         |
| Up to 8 variant metafield columns                    | No    | No        | Yes         |
| Search + B2B visibility controls                     | No    | No        | Yes         |
| CSV / spreadsheet paste                              | No    | No        | Yes         |
| Variant rule overrides                               | No    | No        | Yes         |
| Remove app branding                                  | No    | No        | Yes         |

Public-price recommendation for Shopify App Pricing: Starter `$7.99/month` or `$79/year`; Pro `$14.99/month` or `$149/year`, with a 7-day paid-plan trial. Keep private test plans out of App Store listing copy.

## Local development

Requirements: Node 24, pnpm 12, Docker, Shopify CLI, a development Shopify app/store, Partner API billing credentials.

```bash
corepack enable
pnpm install
cp sample.env .env   # then replace the vault placeholders with real values
pnpm infra:up
pnpm db:setup
```

Link the dedicated development Shopify app to `shopify.app.varyzaq-quick-order-dev.toml` (`pnpm config:link`), then run:

```bash
pnpm dev
```

To run the BullMQ worker in Docker alongside Shopify CLI:

```bash
pnpm worker:up
pnpm worker:logs
```

The local Docker database is `variant_quick_order_development`; use separate databases for staging and production (`variant_quick_order_staging`, `variant_quick_order_production`).

## Merchant setup

1. Install the app and choose a plan through Shopify App Pricing.
2. In Shopify Admin, open a product and add/pin the **Variant Quick Order** Admin block.
3. Enable Quick Order for the product and save.
4. In the app, open **Storefront** and configure columns, labels, sorting, quantity defaults and mobile layout.
5. In the Theme Editor, add the **Variant quick order** app block to the desired product template.
6. Pro merchants can optionally configure per-variant fallback quantity rules from the variant Admin block.
7. If a merchant customizes the app-proxy URL under Shopify app settings, update the Theme block's **App proxy path** field to the customized `/prefix/subpath`.

## Environment and deployment

The repository includes three isolated Shopify config files following the platform convention:

- `shopify.app.varyzaq-quick-order-dev.toml`
- `shopify.app.varyzaq-quick-order-staging.toml`
- `shopify.app.varyzaq-quick-order.toml` (production)

Each environment must have its own Shopify app identity, secrets, app URL, webhooks, PostgreSQL database and Redis namespace/runtime identity. Deploy only after linking each config to the matching app.

```bash
pnpm deploy:staging
pnpm deploy:production
```

`docker-compose.dokploy.example.yaml` preserves the Material Calculator pattern of sharing low-resource Postgres/Redis infrastructure while keeping app/environment data and BullMQ queue names isolated.

## Verification

```bash
pnpm lint:configs
pnpm test:all
pnpm typecheck
pnpm build
# or all at once:
pnpm check
```

See `docs/` for architecture, API/cost behavior, competitor research, App Store submission copy, review instructions and launch/media checklists.
