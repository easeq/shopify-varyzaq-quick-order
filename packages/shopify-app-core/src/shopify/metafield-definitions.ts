export interface ShopifyAdminGraphqlClient {
  graphql(
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    },
  ): Promise<Response>;
}

export interface AppOwnedMetafieldDefinitionInput {
  name: string;
  namespace?: "$app" | `$app:${string}`;
  key: string;
  description?: string;
  type: string;
  ownerType: string;
  access?: {
    admin?: "MERCHANT_READ" | "MERCHANT_READ_WRITE";
    storefront?: "PUBLIC_READ" | "NONE";
  };
  validations?: Array<{ name: string; value: string }>;
}

interface ExistingDefinition {
  id: string;
  namespace: string;
  key: string;
  type: {
    name: string;
  };
}

/**
 * Idempotently ensures an app-owned metafield definition through Admin GraphQL.
 *
 * Prefer declarative TOML for static definitions. This helper exists for
 * dynamically generated definitions and for owner types that a currently used
 * Shopify CLI schema cannot validate even though Admin GraphQL supports them.
 */
export async function ensureAppOwnedMetafieldDefinition(params: {
  admin: ShopifyAdminGraphqlClient;
  definition: AppOwnedMetafieldDefinitionInput;
}): Promise<ExistingDefinition> {
  const namespace = params.definition.namespace ?? "$app";
  const existing = await findDefinition({
    admin: params.admin,
    ownerType: params.definition.ownerType,
    namespace,
    key: params.definition.key,
  });

  if (existing) {
    assertDefinitionType(existing, params.definition.type);
    return existing;
  }

  const response = await params.admin.graphql(
    `#graphql
      mutation EnsureAppOwnedMetafieldDefinition(
        $definition: MetafieldDefinitionInput!
      ) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            namespace
            key
            type {
              name
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      variables: {
        definition: {
          ...params.definition,
          namespace,
        },
      },
    },
  );

  const json = await response.json();
  const created = json.data?.metafieldDefinitionCreate?.createdDefinition as
    ExistingDefinition | null | undefined;
  const errors = json.data?.metafieldDefinitionCreate?.userErrors ?? [];

  if (created) {
    assertDefinitionType(created, params.definition.type);
    return created;
  }

  // Another replica can win the create race. Re-read before surfacing an error.
  const raced = await findDefinition({
    admin: params.admin,
    ownerType: params.definition.ownerType,
    namespace,
    key: params.definition.key,
  });

  if (raced) {
    assertDefinitionType(raced, params.definition.type);
    return raced;
  }

  throw new Error(
    errors.length > 0
      ? errors.map((error: { message: string }) => error.message).join("; ")
      : `Shopify did not create metafield definition ${namespace}.${params.definition.key}.`,
  );
}

async function findDefinition(params: {
  admin: ShopifyAdminGraphqlClient;
  ownerType: string;
  namespace: string;
  key: string;
}): Promise<ExistingDefinition | null> {
  const response = await params.admin.graphql(
    `#graphql
      query AppOwnedMetafieldDefinition(
        $ownerType: MetafieldOwnerType!
        $namespace: String!
        $key: String!
      ) {
        metafieldDefinitions(
          first: 1
          ownerType: $ownerType
          namespace: $namespace
          key: $key
        ) {
          nodes {
            id
            namespace
            key
            type {
              name
            }
          }
        }
      }
    `,
    {
      variables: {
        ownerType: params.ownerType,
        namespace: params.namespace,
        key: params.key,
      },
    },
  );

  const json = await response.json();
  return json.data?.metafieldDefinitions?.nodes?.[0] ?? null;
}

function assertDefinitionType(definition: ExistingDefinition, expectedType: string): void {
  if (definition.type.name !== expectedType) {
    throw new Error(
      `Existing metafield definition ${definition.namespace}.${definition.key} ` +
        `has type "${definition.type.name}"; expected "${expectedType}".`,
    );
  }
}
