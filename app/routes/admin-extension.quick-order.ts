import type { LoaderFunctionArgs } from "react-router";
import { getAdminExtensionEntitlements } from "../services/admin-extension-entitlements.server";
import { authenticate } from "../shopify.server";
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  if (!session.accessToken)
    return Response.json({ error: "Missing access token." }, { status: 401 });
  const entitlements = await getAdminExtensionEntitlements({
    shop: session.shop,
    adminAccessToken: session.accessToken,
  });
  const response = await admin.graphql(
    `#graphql query QuickOrderConfiguredProducts($query: String!, $limit: Int) { productsCount(query: $query, limit: $limit) { count } }`,
    {
      variables: {
        query: "metafields.$app.quick_order_configured:true",
        limit:
          entitlements.limits.configuredProducts == null
            ? null
            : Math.max(1, entitlements.limits.configuredProducts + 1),
      },
    },
  );
  const json = (await response.json()) as any;
  return Response.json({
    ...entitlements,
    configuredProducts: Number(json.data?.productsCount?.count ?? 0),
  });
}
