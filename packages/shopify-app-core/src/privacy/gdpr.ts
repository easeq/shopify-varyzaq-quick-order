export const GDPR_TOPICS = ["CUSTOMERS_DATA_REQUEST", "CUSTOMERS_REDACT", "SHOP_REDACT"] as const;

export type GdprTopic = (typeof GDPR_TOPICS)[number];

export interface GdprJobData {
  shop: string;
  customerId?: string;
  shopId?: string;
  orderIds?: string[];
}

export interface GdprHandlers {
  customersDataRequest(data: GdprJobData): Promise<void>;
  customersRedact(data: GdprJobData): Promise<void>;
  shopRedact(data: GdprJobData): Promise<void>;
}

export function isGdprTopic(topic: string): topic is GdprTopic {
  return (GDPR_TOPICS as readonly string[]).includes(topic.toUpperCase());
}

/**
 * Keep only identifiers required for compliance work. In particular, customer
 * names/emails are intentionally not copied into BullMQ job payloads.
 */
export function sanitizeGdprPayload(params: {
  shop: string;
  topic: GdprTopic;
  payload: unknown;
}): GdprJobData {
  const payload = asRecord(params.payload);
  const customer = asRecord(payload.customer);
  const requestedOrders = Array.isArray(payload.orders_requested) ? payload.orders_requested : [];
  const redactedOrders = Array.isArray(payload.orders_to_redact) ? payload.orders_to_redact : [];
  const orderIds = [...new Set([...requestedOrders, ...redactedOrders].map((id) => String(id)))];
  const shopId = payload.shop_id;

  return {
    shop: params.shop,
    ...(customer.id !== undefined ? { customerId: String(customer.id) } : {}),
    ...(shopId !== undefined ? { shopId: String(shopId) } : {}),
    ...(orderIds.length > 0 ? { orderIds } : {}),
  };
}

export function createGdprProcessor(handlers: GdprHandlers) {
  return async (topic: GdprTopic, data: GdprJobData): Promise<void> => {
    switch (topic) {
      case "CUSTOMERS_DATA_REQUEST":
        return handlers.customersDataRequest(data);
      case "CUSTOMERS_REDACT":
        return handlers.customersRedact(data);
      case "SHOP_REDACT":
        return handlers.shopRedact(data);
    }
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
