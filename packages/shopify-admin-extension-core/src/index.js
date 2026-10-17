export const ADMIN_UI_BLOCK_TARGETS = Object.freeze({
  product: "admin.product-details.block.render",
  productVariant: "admin.product-variant-details.block.render",
});

export const ADMIN_GRAPHQL_URL = "shopify:admin/api/graphql.json";

/**
 * Executes Admin GraphQL directly from an Admin UI extension. Shopify
 * authenticates requests to the shopify:admin custom protocol automatically.
 */
export async function adminGraphql(query, variables = {}) {
  const response = await fetch(ADMIN_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Shopify Admin GraphQL returned HTTP ${response.status}.`);
  }

  if (!response.ok) {
    throw new Error(
      graphqlErrorMessage(payload) || `Shopify Admin GraphQL returned HTTP ${response.status}.`,
    );
  }

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    throw new Error(graphqlErrorMessage(payload));
  }

  return payload?.data ?? {};
}

export async function appBackendJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Leave payload null and surface the HTTP status below.
  }

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : `App backend returned HTTP ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

export function selectedResourceId(shopifyApi = globalThis.shopify) {
  return shopifyApi?.data?.selected?.[0]?.id ?? null;
}

/**
 * Values written by the owning app should omit namespace. Shopify resolves the
 * omitted namespace to the current app's reserved namespace.
 */
export function appOwnedMetafieldValue({ ownerId, key, type, value }) {
  return { ownerId, key, type, value };
}

export async function setAppOwnedMetafields(metafields) {
  const data = await adminGraphql(
    `#graphql
      mutation AppPlatformSetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    { metafields },
  );

  assertUserErrors("Saving app-owned metafields", data.metafieldsSet?.userErrors);
  return data.metafieldsSet?.metafields ?? [];
}

export async function deleteMetafield({ ownerId, namespace, key }) {
  if (!namespace) return [];

  const data = await adminGraphql(
    `#graphql
      mutation AppPlatformDeleteMetafields(
        $metafields: [MetafieldIdentifierInput!]!
      ) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields {
            ownerId
            namespace
            key
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      metafields: [{ ownerId, namespace, key }],
    },
  );

  assertUserErrors("Deleting app-owned metafield", data.metafieldsDelete?.userErrors);
  return data.metafieldsDelete?.deletedMetafields ?? [];
}

export function assertUserErrors(operation, errors) {
  if (!Array.isArray(errors) || errors.length === 0) return;

  throw new Error(
    `${operation} failed: ${errors
      .map((error) => error?.message)
      .filter(Boolean)
      .join("; ")}`,
  );
}

export function capabilitySet(value) {
  return new Set(
    String(value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function graphqlErrorMessage(payload) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  return errors
    .map((error) => error?.message)
    .filter(Boolean)
    .join("; ");
}
