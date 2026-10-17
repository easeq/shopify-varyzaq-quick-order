export interface QuantityRule {
  minimum: number;
  maximum: number | null;
  increment: number;
  casePack: number | null;
}

export type QuantityRuleSource = "shopify" | "app" | "default";

export interface ResolvedQuantityRule extends QuantityRule {
  source: QuantityRuleSource;
}

export const DEFAULT_QUANTITY_RULE: Readonly<QuantityRule> = Object.freeze({
  minimum: 1,
  maximum: null,
  increment: 1,
  casePack: null,
});

export function normalizeQuantityRule(value: unknown): QuantityRule {
  const source = asRecord(value);
  const increment = positiveInt(source.increment, 1);
  let minimum = positiveInt(source.minimum, increment);
  if (minimum % increment !== 0) minimum = Math.ceil(minimum / increment) * increment;

  const maximumRaw = nullablePositiveInt(source.maximum);
  let maximum = maximumRaw;
  if (maximum !== null) {
    maximum = Math.max(minimum, maximum);
    if (maximum % increment !== 0) maximum = Math.floor(maximum / increment) * increment;
    if (maximum < minimum) maximum = minimum;
  }

  const casePack = nullablePositiveInt(source.casePack);
  return { minimum, maximum, increment, casePack };
}

export function resolveQuantityRule(params: {
  shopify?: unknown;
  app?: unknown;
  fallback?: unknown;
  preferShopify?: boolean;
}): ResolvedQuantityRule {
  const app = hasMeaningfulRule(params.app) ? normalizeQuantityRule(params.app) : null;
  const shopify = hasMeaningfulRule(params.shopify) ? normalizeQuantityRule(params.shopify) : null;
  const fallback = normalizeQuantityRule(params.fallback ?? DEFAULT_QUANTITY_RULE);

  if (params.preferShopify !== false && shopify) return { ...shopify, source: "shopify" };
  if (app) return { ...app, source: "app" };
  if (shopify) return { ...shopify, source: "shopify" };
  return { ...fallback, source: "default" };
}

export function normalizeOrderQuantity(quantity: unknown, ruleValue: unknown): number {
  const rule = normalizeQuantityRule(ruleValue);
  let quantityValue = Number(quantity);
  if (!Number.isFinite(quantityValue) || quantityValue <= 0) return 0;
  quantityValue = Math.max(rule.minimum, Math.trunc(quantityValue));
  quantityValue = Math.ceil(quantityValue / rule.increment) * rule.increment;
  if (rule.maximum !== null) quantityValue = Math.min(quantityValue, rule.maximum);
  return quantityValue;
}

export function validateOrderQuantity(quantity: unknown, ruleValue: unknown): string | null {
  const quantityValue = Number(quantity);
  if (!Number.isInteger(quantityValue) || quantityValue < 0) return "Enter a whole-number quantity.";
  if (quantityValue === 0) return null;
  const rule = normalizeQuantityRule(ruleValue);
  if (quantityValue < rule.minimum) return `Minimum quantity is ${rule.minimum}.`;
  if (rule.maximum !== null && quantityValue > rule.maximum) return `Maximum quantity is ${rule.maximum}.`;
  if (quantityValue % rule.increment !== 0) return `Quantity must be in increments of ${rule.increment}.`;
  return null;
}

function hasMeaningfulRule(value: unknown): boolean {
  const source = asRecord(value);
  return ["minimum", "maximum", "increment", "casePack"].some((key) => source[key] !== undefined && source[key] !== null && source[key] !== "");
}
function positiveInt(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}
function nullablePositiveInt(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}
function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
