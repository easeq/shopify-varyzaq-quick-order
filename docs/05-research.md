# Competitive and platform research — 2026-09-17

## Product patterns observed

Shopify App Store competitors establish a clear buyer expectation: spreadsheet/table ordering, quantity inputs across variants, one-action cart adds, min/max/increment controls, mobile-friendly layouts and progressively richer wholesale tools such as SKU/CSV paste, barcode/search and custom columns.

Examples reviewed:
- MultiVariants – B2B quantity/min-max/increment/case-pack and matrix/table patterns.
- Smart Variant Kit – table/matrix/card layouts, search/filtering and custom columns.
- Bulk Order Supreme – bulk grid plus copy/paste and CSV/Excel workflows.
- Quick Order B2B Grid – catalog grid, search/filter, barcode and CSV import; $19.99/month at research time.
- Ordexis Bulk Order by SKU CSV – SKU/UPC/Excel/CSV ordering; $12/month at research time.
- InstaOrders B2B/CSV Order Form – B2B pricing/quantity rules and CSV; $6.99/month at research time.

## Deliberate differentiation

Variant Quick Order stays product-page focused instead of becoming a catalog/search/order-history platform. That keeps it metadata-first, low-resource and aligned with the existing app family. Pro differentiates on workflows that matter specifically for dense variants: spreadsheet paste, advanced per-row information, B2B visibility controls and high-variant paging.

## Shopify implementation facts used

- Ajax Cart accepts multiple variants in a single `items` array.
- Native Liquid variant quantity rules expose min/max/increment in the active page context.
- Liquid product variants have a 250 unpaginated ceiling and products can have up to 2,048 variants.
- App proxies are authenticated and can return Storefront/Admin API contexts for installed shops; configuring them requires `write_app_proxy`.
- Merchants can customize the app-proxy prefix/subpath, so the theme block exposes an override for that path.
- Admin GraphQL enforces requested-cost throttling and a 1,000-point maximum per query.
