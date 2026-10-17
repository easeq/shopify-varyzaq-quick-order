import assert from "node:assert/strict";
import test from "node:test";
import { ensureAppOwnedMetafieldDefinition } from "../src/shopify/metafield-definitions.ts";

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ data }), {
    headers: { "content-type": "application/json" },
  });
}

test("metafield definition helper creates PRODUCTVARIANT app-owned definitions", async () => {
  const calls: Array<{ query: string; variables?: Record<string, unknown> }> = [];

  const admin = {
    async graphql(
      query: string,
      options?: { variables?: Record<string, unknown> },
    ): Promise<Response> {
      calls.push({ query, variables: options?.variables });

      if (query.includes("query AppOwnedMetafieldDefinition")) {
        return jsonResponse({ metafieldDefinitions: { nodes: [] } });
      }

      return jsonResponse({
        metafieldDefinitionCreate: {
          createdDefinition: {
            id: "gid://shopify/MetafieldDefinition/1",
            namespace: "app--123",
            key: "material_calculator_override",
            type: { name: "json" },
          },
          userErrors: [],
        },
      });
    },
  };

  const result = await ensureAppOwnedMetafieldDefinition({
    admin,
    definition: {
      name: "Variant override",
      namespace: "$app",
      key: "material_calculator_override",
      type: "json",
      ownerType: "PRODUCTVARIANT",
    },
  });

  assert.equal(result.type.name, "json");
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].variables, {
    ownerType: "PRODUCTVARIANT",
    namespace: "$app",
    key: "material_calculator_override",
  });
  assert.equal(
    (calls[1].variables?.definition as { ownerType: string }).ownerType,
    "PRODUCTVARIANT",
  );
});

test("metafield definition helper reuses an existing matching definition", async () => {
  let calls = 0;
  const admin = {
    async graphql(): Promise<Response> {
      calls += 1;
      return jsonResponse({
        metafieldDefinitions: {
          nodes: [
            {
              id: "gid://shopify/MetafieldDefinition/1",
              namespace: "app--123",
              key: "material_calculator_override",
              type: { name: "json" },
            },
          ],
        },
      });
    },
  };

  await ensureAppOwnedMetafieldDefinition({
    admin,
    definition: {
      name: "Variant override",
      key: "material_calculator_override",
      type: "json",
      ownerType: "PRODUCTVARIANT",
    },
  });

  assert.equal(calls, 1);
});

test("metafield definition helper forwards metaobject reference validations", async () => {
  let createdDefinitionInput: Record<string, unknown> | undefined;
  const admin = {
    async graphql(
      query: string,
      options?: { variables?: Record<string, unknown> },
    ): Promise<Response> {
      if (query.includes("query AppOwnedMetafieldDefinition")) {
        return jsonResponse({ metafieldDefinitions: { nodes: [] } });
      }
      createdDefinitionInput = options?.variables?.definition as Record<string, unknown>;
      return jsonResponse({
        metafieldDefinitionCreate: {
          createdDefinition: {
            id: "gid://shopify/MetafieldDefinition/2",
            namespace: "app--123",
            key: "material_calculator_preset",
            type: { name: "metaobject_reference" },
          },
          userErrors: [],
        },
      });
    },
  };

  await ensureAppOwnedMetafieldDefinition({
    admin,
    definition: {
      name: "Variant preset",
      namespace: "$app",
      key: "material_calculator_preset",
      type: "metaobject_reference",
      ownerType: "PRODUCTVARIANT",
      validations: [
        { name: "metaobject_definition_id", value: "gid://shopify/MetaobjectDefinition/9" },
      ],
    },
  });

  assert.deepEqual(createdDefinitionInput?.validations, [
    { name: "metaobject_definition_id", value: "gid://shopify/MetaobjectDefinition/9" },
  ]);
});
