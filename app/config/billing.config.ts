import { createPlanCatalog } from "@app-platform/shopify-core/billing/plans";

export type Tier = "free" | "starter" | "pro";
export const Capability = {
  QUICK_ORDER: "quick_order",
  PRODUCT_CONFIGURATION: "product_configuration",
  UNLIMITED_PRODUCTS: "unlimited_products",
  CUSTOM_COLUMNS: "custom_columns",
  CUSTOM_LABELS: "custom_labels",
  SORTING: "sorting",
  MOBILE_LAYOUT: "mobile_layout",
  QUANTITY_DEFAULTS: "quantity_defaults",
  CSV_PASTE: "csv_paste",
  ADVANCED_COLUMNS: "advanced_columns",
  LARGE_VARIANT_SETS: "large_variant_sets",
  B2B_CONTROLS: "b2b_controls",
  VARIANT_RULE_OVERRIDES: "variant_rule_overrides",
  REMOVE_BRANDING: "remove_branding",
} as const;
export type Capability = (typeof Capability)[keyof typeof Capability];

export interface PlanLimits {
  configuredProducts: number;
  storefrontVariants: number;
  metafieldColumns: number;
}
export const PLAN_CATALOG = createPlanCatalog<Tier, Capability, PlanLimits>({
  order: ["free", "starter", "pro"],
  definitions: [
    {
      tier: "free",
      displayName: "Free",
      handle: "free",
      capabilityAdditions: [Capability.QUICK_ORDER, Capability.PRODUCT_CONFIGURATION],
      limits: { configuredProducts: 3, storefrontVariants: 50, metafieldColumns: 0 },
    },
    {
      tier: "starter",
      displayName: "Starter",
      handle: "starter",
      capabilityAdditions: [
        Capability.UNLIMITED_PRODUCTS,
        Capability.CUSTOM_COLUMNS,
        Capability.CUSTOM_LABELS,
        Capability.SORTING,
        Capability.MOBILE_LAYOUT,
        Capability.QUANTITY_DEFAULTS,
      ],
      limits: {
        configuredProducts: Number.POSITIVE_INFINITY,
        storefrontVariants: 250,
        metafieldColumns: 0,
      },
    },
    {
      tier: "pro",
      displayName: "Pro",
      handle: "pro",
      capabilityAdditions: [
        Capability.CSV_PASTE,
        Capability.ADVANCED_COLUMNS,
        Capability.LARGE_VARIANT_SETS,
        Capability.B2B_CONTROLS,
        Capability.VARIANT_RULE_OVERRIDES,
        Capability.REMOVE_BRANDING,
      ],
      limits: {
        configuredProducts: Number.POSITIVE_INFINITY,
        storefrontVariants: 2048,
        metafieldColumns: 8,
      },
    },
  ],
});
export const ALL_PLAN_HANDLES = PLAN_CATALOG.allHandles;
export const getPlanCapabilities = (tier: Tier) => PLAN_CATALOG.capabilitiesFor(tier);
export const hasCapability = (tier: Tier, capability: Capability) =>
  PLAN_CATALOG.hasCapability(tier, capability);
export const getPlanLimit = (tier: Tier, key: keyof PlanLimits) =>
  PLAN_CATALOG.limitsFor(tier)[key];
export const normalizePlanHandle = (value?: string | null): Tier =>
  PLAN_CATALOG.normalizeHandle(value) ?? "free";
