import type { LoaderFunctionArgs } from "react-router";
import { Capability, getPlanLimit, hasCapability } from "../config/billing.config";
import { getShopTier } from "../services/billing.server";
import { getQuickOrderSettings } from "../services/quick-order-settings.server";
import { authenticate } from "../shopify.server";

const MAX_PAGE_SIZE = 100;
const ALLOWED_COUNTRY_CODE = /^[A-Z]{2}$/;

export async function loader({ request }: LoaderFunctionArgs) {
  const context = await authenticate.public.appProxy(request);
  if (!context.storefront || !context.admin || !context.session) {
    return Response.json({ error: "Quick Order is not available for this shop." }, { status: 404 });
  }

  const url = new URL(request.url);
  const handle = String(url.searchParams.get("handle") ?? "").trim();
  const after = url.searchParams.get("after") || null;
  const requested = Number(url.searchParams.get("first") ?? MAX_PAGE_SIZE);
  const countryParam = String(url.searchParams.get("country") ?? "").toUpperCase();
  const country = ALLOWED_COUNTRY_CODE.test(countryParam) ? countryParam : null;

  if (!handle || !/^[A-Za-z0-9_-]+$/.test(handle)) {
    return Response.json({ error: "A valid product handle is required." }, { status: 400 });
  }

  const tier = await getShopTier(context.session.shop);
  if (!hasCapability(tier, Capability.LARGE_VARIANT_SETS)) {
    return Response.json({ error: "Large variant sets require Pro." }, { status: 403 });
  }

  const settings = await getQuickOrderSettings({ admin: context.admin, tier });
  const pageSize = Math.max(
    1,
    Math.min(MAX_PAGE_SIZE, requested, getPlanLimit(tier, "storefrontVariants")),
  );
  const identifiers = settings.metafieldColumns.map(({ namespace, key }) => ({ namespace, key }));

  const response = await context.storefront.graphql(
    `#graphql
      query QuickOrderVariantPage(
        $handle: String!
        $first: Int!
        $after: String
        $identifiers: [HasMetafieldsIdentifier!]!
        $country: CountryCode
      ) @inContext(country: $country) {
        product(handle: $handle) {
          id
          variants(first: $first, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              title
              sku
              barcode
              availableForSale
              quantityAvailable
              selectedOptions { name value }
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              quantityRule { minimum maximum increment }
              quantityPriceBreaks(first: 5) {
                nodes { minimumQuantity price { amount currencyCode } }
              }
              appRule: metafield(key: "quick_order_rule") { value }
              metafields(identifiers: $identifiers) { namespace key value type }
            }
          }
        }
      }
    `,
    { variables: { handle, first: pageSize, after, identifiers, country } },
  );

  const json = (await response.json()) as any;
  if (!response.ok || json.errors?.length) {
    return Response.json(
      {
        error:
          json.errors
            ?.map((error: any) => error.message)
            .filter(Boolean)
            .join("; ") || "Could not load variants.",
      },
      { status: 502 },
    );
  }

  const connection = json.data?.product?.variants;
  if (!connection) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }

  const variants = (connection.nodes ?? []).map((node: any) => ({
    ...node,
    appRule: parseJson(node.appRule?.value),
    source: "proxy",
  }));

  return Response.json(
    { variants, pageInfo: connection.pageInfo, tier },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

function parseJson(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
