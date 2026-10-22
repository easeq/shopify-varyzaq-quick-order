import type { ActionFunctionArgs } from "react-router";
import { getWebhookQueue, JOB_TYPES } from "../queues/queue.server";
import { verifyShopifyWebhook } from "../services/webhook-auth.server";
export async function action({ request }: ActionFunctionArgs) {
  const { shop, topic, webhookId } = await verifyShopifyWebhook(request);
  if (topic !== "APP_UNINSTALLED") throw new Response("Unsupported webhook", { status: 404 });
  await getWebhookQueue().add(
    JOB_TYPES.WEBHOOK_APP_UNINSTALLED,
    { shop },
    { ...(webhookId ? { jobId: `uninstall-${webhookId}` } : {}) },
  );
  return new Response(null, { status: 200 });
}
