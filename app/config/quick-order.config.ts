import { normalizeQuantityRule, type QuantityRule } from "@app-platform/quantity-rules";
import { Capability, hasCapability, type Tier } from "./billing.config";

export type StandardColumnId =
  "options" | "sku" | "barcode" | "price" | "inventory" | "casePack" | "quantityRule" | "quantity";

export interface MetafieldColumn {
  id: string;
  namespace: string;
  key: string;
  label: string;
}

export type ColumnLabels = Record<StandardColumnId, string>;

export interface QuickOrderSettings {
  version: 1;
  heading: string;
  addButtonLabel: string;
  csvLabel: string;
  columnLabels: ColumnLabels;
  visibleColumns: StandardColumnId[];
  metafieldColumns: MetafieldColumn[];
  sortBy: "position" | "title" | "sku";
  sortDirection: "asc" | "desc";
  mobileLayout: "cards" | "scroll";
  hideSoldOut: boolean;
  showSearch: boolean;
  showTotals: boolean;
  inventoryDisplay: "status" | "quantity";
  defaultRule: QuantityRule;
  preferShopifyB2BRules: boolean;
  requireLoggedInCustomer: boolean;
  requireB2BCompany: boolean;
}

export interface ProductQuickOrderConfig {
  version: 1;
  enabled: boolean;
  heading: string;
  sortBy: "global" | "position" | "title" | "sku";
  hideSoldOut: "global" | "show" | "hide";
}

export const DEFAULT_COLUMN_LABELS: ColumnLabels = {
  options: "Options",
  sku: "SKU",
  barcode: "Barcode",
  price: "Price",
  inventory: "Availability",
  casePack: "Case / pack",
  quantityRule: "Quantity rule",
  quantity: "Quantity",
};

export const DEFAULT_SETTINGS: QuickOrderSettings = {
  version: 1,
  heading: "Quick order",
  addButtonLabel: "Add selected to cart",
  csvLabel: "Paste SKU and quantity",
  columnLabels: DEFAULT_COLUMN_LABELS,
  visibleColumns: ["options", "sku", "price", "inventory", "quantity"],
  metafieldColumns: [],
  sortBy: "position",
  sortDirection: "asc",
  mobileLayout: "cards",
  hideSoldOut: false,
  showSearch: false,
  showTotals: true,
  inventoryDisplay: "status",
  defaultRule: normalizeQuantityRule({}),
  preferShopifyB2BRules: true,
  requireLoggedInCustomer: false,
  requireB2BCompany: false,
};

export const DEFAULT_PRODUCT_CONFIG: ProductQuickOrderConfig = {
  version: 1,
  enabled: true,
  heading: "",
  sortBy: "global",
  hideSoldOut: "global",
};

export function normalizeQuickOrderSettings(value: unknown, tier: Tier): QuickOrderSettings {
  const source = asRecord(value);
  const requestedColumns = Array.isArray(source.visibleColumns)
    ? source.visibleColumns.map(String)
    : DEFAULT_SETTINGS.visibleColumns;
  const allowed: StandardColumnId[] = hasCapability(tier, Capability.ADVANCED_COLUMNS)
    ? ["options", "sku", "barcode", "price", "inventory", "casePack", "quantityRule", "quantity"]
    : ["options", "sku", "price", "inventory", "quantity"];
  const visibleColumns = requestedColumns.filter((column): column is StandardColumnId =>
    allowed.includes(column as StandardColumnId),
  );
  if (!visibleColumns.includes("quantity")) visibleColumns.push("quantity");

  const metafieldColumns = hasCapability(tier, Capability.ADVANCED_COLUMNS)
    ? normalizeMetafieldColumns(source.metafieldColumns).slice(0, 8)
    : [];

  const labels = asRecord(source.columnLabels);
  const columnLabels = Object.fromEntries(
    Object.entries(DEFAULT_COLUMN_LABELS).map(([key, fallback]) => [
      key,
      hasCapability(tier, Capability.CUSTOM_LABELS) ? text(labels[key], fallback, 60) : fallback,
    ]),
  ) as ColumnLabels;

  return {
    version: 1,
    heading: text(source.heading, DEFAULT_SETTINGS.heading, 80),
    addButtonLabel: text(source.addButtonLabel, DEFAULT_SETTINGS.addButtonLabel, 80),
    csvLabel: text(source.csvLabel, DEFAULT_SETTINGS.csvLabel, 80),
    columnLabels,
    visibleColumns,
    metafieldColumns,
    sortBy: ["position", "title", "sku"].includes(String(source.sortBy))
      ? (source.sortBy as QuickOrderSettings["sortBy"])
      : "position",
    sortDirection: source.sortDirection === "desc" ? "desc" : "asc",
    mobileLayout: source.mobileLayout === "scroll" ? "scroll" : "cards",
    hideSoldOut: source.hideSoldOut === true,
    showSearch: hasCapability(tier, Capability.B2B_CONTROLS) && source.showSearch === true,
    showTotals: source.showTotals !== false,
    inventoryDisplay:
      hasCapability(tier, Capability.ADVANCED_COLUMNS) && source.inventoryDisplay === "quantity"
        ? "quantity"
        : "status",
    defaultRule: hasCapability(tier, Capability.QUANTITY_DEFAULTS)
      ? normalizeQuantityRule(source.defaultRule)
      : normalizeQuantityRule({}),
    preferShopifyB2BRules: source.preferShopifyB2BRules !== false,
    requireLoggedInCustomer:
      hasCapability(tier, Capability.B2B_CONTROLS) && source.requireLoggedInCustomer === true,
    requireB2BCompany:
      hasCapability(tier, Capability.B2B_CONTROLS) && source.requireB2BCompany === true,
  };
}

export function normalizeProductConfig(value: unknown): ProductQuickOrderConfig {
  const source = asRecord(value);
  return {
    version: 1,
    enabled: source.enabled !== false,
    heading: text(source.heading, "", 80),
    sortBy: ["position", "title", "sku"].includes(String(source.sortBy))
      ? (source.sortBy as ProductQuickOrderConfig["sortBy"])
      : "global",
    hideSoldOut:
      source.hideSoldOut === "show" || source.hideSoldOut === "hide"
        ? source.hideSoldOut
        : "global",
  };
}

function normalizeMetafieldColumns(value: unknown): MetafieldColumn[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    const source = asRecord(item);
    const namespace = handle(source.namespace);
    const key = handle(source.key);
    if (!namespace || !key) return [];
    return [
      {
        id: text(source.id, `metafield-${index + 1}`, 60),
        namespace,
        key,
        label: text(source.label, key, 80),
      },
    ];
  });
}

function text(value: unknown, fallback: string, max: number) {
  const v = typeof value === "string" ? value.trim() : "";
  return (v || fallback).slice(0, max);
}
function handle(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value.trim())
    ? value.trim()
    : "";
}
function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}
