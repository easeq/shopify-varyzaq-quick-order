import { isGdprTopic, sanitizeGdprPayload } from "@app-platform/shopify-core";
import type { ActionFunctionArgs } from "react-router";
import { getWebhookQueue, JOB_TYPES } from "../queues/queue.server";
import { verifyShopifyWebhook } from "../services/webhook-auth.server";
export async function action({ request }: ActionFunctionArgs) {
  const { shop, topic, payload, webhookId } = await verifyShopifyWebhook(request);
  if (!isGdprTopic(topic)) throw new Response("Unsupported webhook", { status: 404 });
  const sanitized = sanitizeGdprPayload({ shop, topic, payload });
  await getWebhookQueue().add(
    JOB_TYPES.WEBHOOK_GDPR,
    { topic, ...sanitized },
    { ...(webhookId ? { jobId: `gdpr-${webhookId}` } : {}) },
  );
  return new Response(null, { status: 200 });
}
