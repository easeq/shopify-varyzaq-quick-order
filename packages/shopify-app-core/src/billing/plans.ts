export interface PlanTierInput<Tier extends string, Capability extends string, Limits> {
  tier: Tier;
  displayName: string;
  /**
   * The single Shopify App Pricing plan handle configured in Partner Dashboard.
   * Monthly/yearly billing options belong to this plan and do not get separate
   * application handles.
   */
  handle: string;
  capabilityAdditions: readonly Capability[];
  limits: Limits;
}

export interface PlanTierDefinition<
  Tier extends string,
  Capability extends string,
  Limits,
> extends PlanTierInput<Tier, Capability, Limits> {
  /** Private $0 boundary-test plan. Always `${handle}-test`. */
  testHandle: string;
}

export interface ResolvedPlanHandle<Tier extends string> {
  tier: Tier;
  handle: string;
  liveHandle: string;
  testHandle: string;
  isTest: boolean;
}

export interface PlanCatalog<Tier extends string, Capability extends string, Limits> {
  readonly order: readonly Tier[];
  readonly plans: Readonly<Record<Tier, PlanTierDefinition<Tier, Capability, Limits>>>;
  readonly allHandles: readonly string[];
  normalizeHandle(handle?: string | null): Tier | null;
  resolveHandle(handle?: string | null): ResolvedPlanHandle<Tier> | null;
  liveHandleFor(tier: Tier): string;
  testHandleFor(tier: Tier): string;
  hasCapability(tier: Tier, capability: Capability): boolean;
  capabilitiesFor(tier: Tier): ReadonlySet<Capability>;
  tierAtLeast(tier: Tier, minimumTier: Tier): boolean;
  minimumTierFor(capability: Capability): Tier | null;
  limitsFor(tier: Tier): Limits;
}

export function createPlanCatalog<Tier extends string, Capability extends string, Limits>(params: {
  order: readonly Tier[];
  definitions: readonly PlanTierInput<Tier, Capability, Limits>[];
}): PlanCatalog<Tier, Capability, Limits> {
  const { order, definitions } = params;
  const plans = {} as Record<Tier, PlanTierDefinition<Tier, Capability, Limits>>;
  const handleMap = new Map<string, ResolvedPlanHandle<Tier>>();
  const capabilityMap = new Map<Tier, ReadonlySet<Capability>>();
  const minimumTierMap = new Map<Capability, Tier>();

  for (const definition of definitions) {
    const liveHandle = normalizeHandleKey(definition.handle);

    if (!liveHandle) {
      throw new Error(`Plan ${definition.tier} requires a non-empty handle.`);
    }

    if (liveHandle.endsWith("-test")) {
      throw new Error(`Live plan handle "${definition.handle}" must not end in -test.`);
    }

    const testHandle = `${liveHandle}-test`;
    const storedDefinition = {
      ...definition,
      handle: liveHandle,
      testHandle,
    };

    plans[definition.tier] = storedDefinition;

    registerHandle(handleMap, {
      tier: definition.tier,
      handle: liveHandle,
      liveHandle,
      testHandle,
      isTest: false,
    });
    registerHandle(handleMap, {
      tier: definition.tier,
      handle: testHandle,
      liveHandle,
      testHandle,
      isTest: true,
    });
  }

  const runningCapabilities = new Set<Capability>();

  for (const tier of order) {
    const definition = plans[tier];
    if (!definition) {
      throw new Error(`Missing plan definition for tier: ${tier}`);
    }

    for (const capability of definition.capabilityAdditions) {
      runningCapabilities.add(capability);
      if (!minimumTierMap.has(capability)) {
        minimumTierMap.set(capability, tier);
      }
    }

    capabilityMap.set(tier, new Set(runningCapabilities));
  }

  return {
    order,
    plans,
    allHandles: Array.from(handleMap.keys()),
    normalizeHandle(handle) {
      if (!handle) return null;
      return handleMap.get(normalizeHandleKey(handle))?.tier ?? null;
    },
    resolveHandle(handle) {
      if (!handle) return null;
      return handleMap.get(normalizeHandleKey(handle)) ?? null;
    },
    liveHandleFor(tier) {
      return plans[tier].handle;
    },
    testHandleFor(tier) {
      return plans[tier].testHandle;
    },
    hasCapability(tier, capability) {
      return capabilityMap.get(tier)?.has(capability) ?? false;
    },
    capabilitiesFor(tier) {
      return capabilityMap.get(tier) ?? new Set<Capability>();
    },
    tierAtLeast(tier, minimumTier) {
      return order.indexOf(tier) >= order.indexOf(minimumTier);
    },
    minimumTierFor(capability) {
      return minimumTierMap.get(capability) ?? null;
    },
    limitsFor(tier) {
      return plans[tier].limits;
    },
  };
}

function registerHandle<Tier extends string>(
  handleMap: Map<string, ResolvedPlanHandle<Tier>>,
  resolved: ResolvedPlanHandle<Tier>,
): void {
  if (handleMap.has(resolved.handle)) {
    throw new Error(`Duplicate Shopify App Pricing handle: ${resolved.handle}`);
  }

  handleMap.set(resolved.handle, resolved);
}

function normalizeHandleKey(value: string): string {
  return value.trim().toLowerCase();
}
