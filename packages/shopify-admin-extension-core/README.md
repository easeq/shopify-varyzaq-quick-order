# Shopify Admin Extension Core

Browser-safe primitives for Shopify Admin UI extensions built with the current Preact/Web Components runtime.

## Responsibilities

- Canonical product and ProductVariant Admin block targets.
- Direct, automatically authenticated Admin GraphQL calls through `shopify:admin/api/graphql.json`.
- Access to the selected Shopify resource through `shopify.data.selected`.
- App-owned metafield inputs that intentionally omit `namespace` for writes by the owning app.
- Metafield deletion helpers that use the concrete namespace returned by Shopify.
- Capability parsing for storefront/admin extension gates.

## Runtime boundary

This package is safe to bundle into an Admin UI extension. It does not import Node.js APIs, Prisma, Redis, the app server, or secret environment variables.

An iframe App Home uses `shopify://admin/...` links to leave the iframe and navigate to Shopify Admin. Admin UI extensions use the separate `shopify:admin/...` custom protocol, including the Direct API endpoint. Keep those surfaces distinct.

## Example

```js
import {
  adminGraphql,
  selectedResourceId,
  setAppOwnedMetafields,
} from "@app-platform/shopify-admin-extension-core";

const productId = selectedResourceId();

await setAppOwnedMetafields([
  {
    ownerId: productId,
    key: "my_app_configuration",
    type: "json",
    value: JSON.stringify({ enabled: true }),
  },
]);
```

The owning app should normally omit `namespace` when setting its app-owned metafield values. Shopify resolves the omitted namespace to the app-reserved namespace.
