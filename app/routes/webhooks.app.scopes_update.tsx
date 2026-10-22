import type { ActionFunctionArgs } from "react-router";
import db from "../db.server";
import { verifyShopifyWebhook } from "../services/webhook-auth.server";
export async function action({ request }: ActionFunctionArgs) {
  const { payload, topic, shop } = await verifyShopifyWebhook(request);
  if (topic !== "APP_SCOPES_UPDATE") throw new Response("Unsupported webhook", { status: 404 });
  const current = Array.isArray(payload.current)
    ? payload.current.filter((scope): scope is string => typeof scope === "string")
    : [];
  await db.session.updateMany({ where: { shop }, data: { scope: current.join(",") } });
  return new Response(null, { status: 200 });
}
