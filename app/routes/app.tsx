import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ensureVariantRuleDefinition } from "../services/custom-data.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  await ensureVariantRuleDefinition({ admin, shop: session.shop }).catch((error) =>
    console.error("[custom-data] variant rule definition", error),
  );
  return { apiKey: process.env.SHOPIFY_API_KEY ?? "" };
}
export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/settings">Storefront</s-link>
        <s-link href="/app/billing">My plan</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers: HeadersFunction = (args) => boundary.headers(args);
