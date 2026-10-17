export interface ActiveSubscriptionItem {
  handle: string;
  description: string | null;
  price: {
    __typename: string;
    active: boolean;
    currency: string;
    amount?: string;
    tiersMode?: string;
    tiers?: Array<{
      upTo: string | null;
      amountPerUnit: string;
      amount: string;
    }>;
  };
  discount?: {
    amount: string | null;
    percentage: number | null;
    remainingDiscountCycles: number | null;
  } | null;
  usage?: {
    quantity: string;
    cost: {
      amount: string;
      currencyCode: string;
    };
  } | null;
}

export interface ActiveSubscriptionResponse {
  billingPeriod: string;
  cancelAtEndOfCycle: boolean;
  trialEndsAt: string | null;
  currentBillingCycle: {
    startTime: string;
    endTime: string;
  };
  items: ActiveSubscriptionItem[];
  pendingUpdate: {
    billingPeriod: string;
    items: Array<{ handle: string }>;
  } | null;
}

export type BillingCheckResult =
  | { status: "ok"; subscription: ActiveSubscriptionResponse }
  | { status: "no_subscription" }
  | { status: "wrong_plan"; currentHandles: string[] };

export interface PartnerBillingClientOptions {
  adminApiVersion: string;
  partnerApiVersion: string;
  partnerOrgId: string;
  partnerAccessToken: string;
  appGid: string;
  fetchImpl?: typeof fetch;
}

const SHOP_ID_QUERY = `#graphql
  query ShopId {
    shop {
      id
      myshopifyDomain
    }
  }
`;

const ACTIVE_SUBSCRIPTION_QUERY = `#graphql
  query ActiveSubscription($appId: ID!, $shopId: ID!) {
    activeSubscription(appId: $appId, shopId: $shopId) {
      billingPeriod
      cancelAtEndOfCycle
      trialEndsAt
      currentBillingCycle {
        startTime
        endTime
      }
      items {
        handle
        description
        price {
          __typename
          active
          currency
          ... on FlatRatePrice {
            amount
          }
          ... on TieredPrice {
            tiersMode
            tiers {
              upTo
              amountPerUnit
              amount
            }
          }
        }
        discount {
          amount
          percentage
          remainingDiscountCycles
        }
        usage {
          quantity
          cost {
            amount
            currencyCode
          }
        }
      }
      pendingUpdate {
        billingPeriod
        items {
          handle
        }
      }
    }
  }
`;

export class PartnerBillingClient {
  private readonly options: PartnerBillingClientOptions;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PartnerBillingClientOptions) {
    this.options = options;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getShopGid(params: { shopDomain: string; adminAccessToken: string }): Promise<string> {
    const response = await this.fetchImpl(
      `https://${params.shopDomain}/admin/api/${this.options.adminApiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": params.adminAccessToken,
        },
        body: JSON.stringify({ query: SHOP_ID_QUERY }),
      },
    );

    const json = (await response.json()) as {
      data?: { shop?: { id?: string } };
      errors?: unknown;
    };

    if (!response.ok || json.errors) {
      throw new Error(
        `Admin API shop query failed: ${JSON.stringify(json.errors ?? response.status)}`,
      );
    }

    const shopId = json.data?.shop?.id;
    if (!shopId) {
      throw new Error("Could not retrieve shop GID from the Admin API.");
    }

    return shopId;
  }

  async getActiveSubscription(shopId: string): Promise<ActiveSubscriptionResponse | null> {
    const partnerApiUrl =
      `https://partners.shopify.com/${this.options.partnerOrgId}` +
      `/api/${this.options.partnerApiVersion}/graphql.json`;

    const response = await this.fetchImpl(partnerApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.options.partnerAccessToken,
      },
      body: JSON.stringify({
        query: ACTIVE_SUBSCRIPTION_QUERY,
        variables: {
          appId: this.options.appGid,
          shopId,
        },
      }),
    });

    const json = (await response.json()) as {
      data?: { activeSubscription?: ActiveSubscriptionResponse | null };
      errors?: unknown;
    };

    if (!response.ok || json.errors) {
      throw new Error(
        `Partner API activeSubscription query failed: ${JSON.stringify(
          json.errors ?? response.status,
        )}`,
      );
    }

    return json.data?.activeSubscription ?? null;
  }

  async checkBilling(params: {
    shopDomain: string;
    adminAccessToken: string;
    allowedPlanHandles?: readonly string[];
  }): Promise<BillingCheckResult> {
    const shopId = await this.getShopGid(params);
    const subscription = await this.getActiveSubscription(shopId);

    if (!subscription) {
      return { status: "no_subscription" };
    }

    const currentHandles = subscription.items.map((item) => item.handle);
    const allowedPlanHandles = params.allowedPlanHandles ?? [];

    if (
      allowedPlanHandles.length > 0 &&
      !currentHandles.some((handle) => allowedPlanHandles.includes(handle))
    ) {
      return {
        status: "wrong_plan",
        currentHandles,
      };
    }

    return {
      status: "ok",
      subscription,
    };
  }
}
