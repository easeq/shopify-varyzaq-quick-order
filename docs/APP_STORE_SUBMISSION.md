# Shopify App Store submission — Variant Quick Order

Fields depending on business-owned URLs, final public branding or support contacts are marked **REQUIRED BEFORE SUBMISSION**.

## Working public name

`Variant Quick Order — Bulk Table`

Before submission, confirm trademark/name availability and align the production Shopify app configuration name with the final listing name.

## Listing summary

**Tagline:** `Bulk-add product variants from a fast wholesale order table.`

**Short description:**
`Turn variant-heavy product pages into a fast order table. Buyers enter quantities across sizes, colors, packs or SKUs and add all selected variants to cart at once. Configure columns, labels, sorting, mobile layout and quantity rules from Shopify Admin.`

**Key benefits:**

1. `Let buyers order many variants without opening each option combination`
2. `Add selected variants to cart in one action`
3. `Show SKU, price, stock and configurable variant details`
4. `Use compact mobile cards that inherit the storefront theme`
5. `Add CSV paste, advanced columns and B2B controls on Pro`

## Category and channels

Recommended primary category: `Orders and shipping > Orders > Order management - Other` or the closest currently available `Wholesale / Order form` category presented by the Partner Dashboard at submission time. Re-check the live taxonomy before filing because Shopify category labels can change.

Online Store: required. POS: not required.

## Pricing

Use Shopify App Pricing only; do not claim approval for outside billing.

### Free

- Up to 3 configured products
- Up to 50 variants per product
- Multi-variant add-to-cart table
- Option, SKU, price, availability and quantity columns
- Compact mobile layout

### Starter

Recommended: `$7.99/month or $79/year`, `7-day trial`

- Unlimited configured products
- Up to 250 variants per product
- Custom labels and sorting
- Theme-native table / compact cards
- Global fallback min/max/increment/case-pack rules

### Pro

Recommended: `$14.99/month or $149/year`, `7-day trial`

- Up to 2,048 variants per product
- CSV / spreadsheet paste by SKU, barcode or variant ID
- Search and B2B visibility controls
- Barcode, case/pack and quantity-rule columns
- Up to 8 selected variant metafield columns
- Variant-specific fallback quantity rules
- Remove app branding

Private test plans used for billing verification must not appear in public listing copy.

## App icon

Source: `marketing/icons/variant-quick-order.svg`.

**REQUIRED BEFORE SUBMISSION:** export to Shopify's currently required production icon dimensions/format and upload through Partner Dashboard. Keep the final icon flat, square, text-free and free of Shopify trademarks.

## Feature media / banners

HTML source files are under `marketing/banners/` and are designed at 1600×900 (plus `marketing/featured/quick-order-featured-media.html` for the listing's featured media):

1. `quick-order-01-hero.html` — storefront table + multi-line cart action
2. `quick-order-02-how-it-works.html` — four-step buyer flow
3. `quick-order-03-merchant-setup.html` — merchant columns/labels/layout configuration
4. `quick-order-04-storefront-features.html` — storefront feature overview
5. `quick-order-05-csv-pro.html` — Pro spreadsheet/SKU paste workflow
6. `quick-order-06-high-variants.html` — Pro high-variant paging + B2B-oriented safeguards

Export browser captures at exactly 1600×900 before upload. Do not include browser chrome or real merchant/customer data.

## Screenshot shot list

1. Storefront table with several quantities entered — alt: `Variant quick order table with multiple quantities selected`
2. Mobile compact-card layout — alt: `Compact mobile bulk order cards on a product page`
3. App storefront settings — alt: `Merchant configuring quick order columns and labels`
4. Product Admin app block — alt: `Product admin block enabling variant quick order`
5. Pro CSV paste — alt: `CSV and spreadsheet quantity paste for variant ordering`

## Promotional video

Remotion composition: `VariantQuickOrderPromo`, 1920×1080, 30 fps, 36 seconds. Source: `marketing/remotion/`.

Suggested sequence: buyer problem → storefront table → one-action cart → merchant controls → Pro CSV/high-variant/B2B controls → end card. Avoid review quotes, unsupported performance claims, pricing overlays and real PII.

## Reviewer instructions

1. Install the app on the review store and select a plan using Shopify App Pricing.
2. Open a product in Shopify Admin and add/pin the **Variant Quick Order** product block.
3. Enable the table and save.
4. Open **Apps > Variant Quick Order > Storefront** and configure visible columns/labels.
5. In Theme Editor, add the **Variant quick order** app block to the product template.
6. On the storefront, enter valid quantities in two or more rows and click **Add selected to cart**; verify each variant appears in cart.
7. Verify invalid min/max/increment quantities are not submitted.
8. On Pro, paste SKU/quantity lines and apply them.
9. On Pro, test a product with more than 250 variants and confirm additional rows load through the app proxy.
10. On Pro, open a variant Admin page and save a fallback case-pack/quantity rule.

No reviewer customer account is required for normal functionality. B2B-only visibility controls can be left off unless the review shop has Shopify B2B company context available.

## Data access explanation

Requested scopes:

- `read_products`: read product/variant data and counts needed for configuration.
- `write_products`: write app-owned product/variant metafield configuration through Admin UI extensions.
- `write_app_proxy`: expose authenticated high-variant paging under the Online Store proxy route.

The app does not request customer or order scopes and does not store customer profiles or order history.

## URLs / contacts required before submission

- **REQUIRED:** privacy policy URL
- **REQUIRED:** support email
- **REQUIRED:** merchant review/contact email
- Recommended: developer website, setup guide, FAQ, demo product URL
- If using video: **REQUIRED:** publicly reachable video URL + thumbnail

## Final checklist

- [ ] Replace all three placeholder `client_id` values by linking the correct Shopify app identities.
- [ ] Set production/staging/development application and redirect URLs.
- [ ] Create public Free/Starter/Pro pricing in Shopify App Pricing; verify annual prices and trial.
- [ ] Verify private test plans map to the correct tiers but are absent from listing copy.
- [ ] Deploy and pin current Admin/Theme extension versions.
- [ ] Test Free 50, Starter 250 and Pro >250 variant behavior.
- [ ] Test app-proxy install/upgrade scope approval (`write_app_proxy`).
- [ ] Export icon and four 1600×900 media assets.
- [ ] Render/review the Remotion promo.
- [ ] Complete support/privacy/demo URLs and reviewer contact information.
