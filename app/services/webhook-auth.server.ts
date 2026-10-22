import { authenticate } from "app/shopify.server";

export interface VerifiedShopifyWebhook {
  shop: string;
  topic: string;
  payload: Record<string, unknown>;
  webhookId: string | null;
  eventId: string | null;
}

export async function verifyShopifyWebhook(request: Request): Promise<VerifiedShopifyWebhook> {
  const { topic, shop, payload } = await authenticate.webhook(request);

  return {
    shop,
    topic: normalizeWebhookTopic(topic),
    payload,
    webhookId: request.headers.get("x-shopify-webhook-id"),
    eventId: request.headers.get("x-shopify-event-id"),
  };
}

export function normalizeWebhookTopic(topic: string): string {
  return topic.trim().toUpperCase().replace(/[\/-]/g, "_");
}
