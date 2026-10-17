# High-variant products and API cost controls

Shopify currently supports up to 2,048 variants per product, while Liquid `product.variants` returns a maximum of 250 unpaginated variants. This app intentionally uses Liquid first because it carries the page's current storefront/customer context.

## Plan behavior

- Free serializes at most 50 Liquid rows.
- Starter serializes at most 250 Liquid rows.
- Pro serializes the first 250, then sequentially requests up to 100 Storefront variants per app-proxy page until `product.variants_count` or 2,048 is reached.

## Admin GraphQL cost discipline

The high-variant connection is never fetched from Admin GraphQL. The proxy uses Storefront GraphQL for variant pages and only uses a small Admin query to read the app-installation settings needed to bound selected metafields. Product Admin blocks request one product plus `variantsCount`, not full variant nodes. Shopify's Admin GraphQL single-query maximum is 1,000 cost points, and standard apps restore 100 points per second; this architecture keeps normal Admin operations far beneath the single-query ceiling and avoids bursty 2,048-node Admin requests.

Selected variant metafields are capped at eight by Pro entitlement. The Storefront `metafields(identifiers:)` input supports far more than this, so configuration never approaches its 250-identifier maximum.

## B2B context limitation

Liquid's first 250 rows use Shopify's current B2B customer/company context. App-proxy Storefront calls can use country/market context but full B2B BuyerInput requires a Customer Access Token. This app intentionally does not create a customer-profile/token database. On appended B2B rows it displays `Calculated in cart` instead of an uncontextualized price and does not claim default Storefront quantity rules are the buyer's company-specific rules. App/global fallback rules continue to work.
