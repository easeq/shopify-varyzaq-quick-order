import assert from "node:assert/strict";
import test from "node:test";
import { createGdprProcessor, isGdprTopic, sanitizeGdprPayload } from "../src/privacy/gdpr.ts";

test("GDPR payload sanitizer keeps only identifiers from a customer data request", () => {
  const data = sanitizeGdprPayload({
    shop: "example.myshopify.com",
    topic: "CUSTOMERS_DATA_REQUEST",
    payload: {
      shop_id: 123,
      customer: {
        id: 456,
        email: "private@example.com",
        phone: "+15551234567",
      },
      orders_requested: [1, 2],
      data_request: { id: 999 },
    },
  });

  assert.deepEqual(data, {
    shop: "example.myshopify.com",
    customerId: "456",
    shopId: "123",
    orderIds: ["1", "2"],
  });
  assert.equal(JSON.stringify(data).includes("private@example.com"), false);
  assert.equal(JSON.stringify(data).includes("+15551234567"), false);
});

test("GDPR payload sanitizer handles customer redaction order identifiers", () => {
  const data = sanitizeGdprPayload({
    shop: "example.myshopify.com",
    topic: "CUSTOMERS_REDACT",
    payload: {
      shop_id: 123,
      customer: { id: 456, email: "private@example.com" },
      orders_to_redact: [10, 11, 10],
    },
  });

  assert.deepEqual(data, {
    shop: "example.myshopify.com",
    customerId: "456",
    shopId: "123",
    orderIds: ["10", "11"],
  });
});

test("GDPR payload sanitizer handles shop redaction payloads", () => {
  const data = sanitizeGdprPayload({
    shop: "example.myshopify.com",
    topic: "SHOP_REDACT",
    payload: { shop_id: 123, shop_domain: "example.myshopify.com" },
  });

  assert.deepEqual(data, {
    shop: "example.myshopify.com",
    shopId: "123",
  });
});

test("GDPR processor dispatches only the requested compliance task", async () => {
  const calls: string[] = [];
  const process = createGdprProcessor({
    async customersDataRequest() {
      calls.push("request");
    },
    async customersRedact() {
      calls.push("customer-redact");
    },
    async shopRedact() {
      calls.push("shop-redact");
    },
  });

  assert.equal(isGdprTopic("shop_redact"), true);
  assert.equal(isGdprTopic("orders/create"), false);

  await process("SHOP_REDACT", { shop: "example.myshopify.com" });
  assert.deepEqual(calls, ["shop-redact"]);
});
