# Security and data handling

Variant Quick Order stores only Shopify session data, cached subscription state and app-owned merchant configuration. It does not maintain a customer profile, customer order-history, cart, or order database.

Storefront high-variant requests are authenticated through Shopify app proxies. Product and variant configuration is stored in app-owned Shopify metafields; global storefront settings and entitlement snapshots are stored on the app installation. Secrets and environment-specific credentials belong only in uncommitted `.env.variant-quick-order.<environment>` files.

Report suspected security issues privately to the maintainer rather than opening a public issue with credentials or store data.
