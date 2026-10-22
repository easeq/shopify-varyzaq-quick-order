import {
  DEFAULT_SETTINGS,
  normalizeQuickOrderSettings,
  type QuickOrderSettings,
} from "../config/quick-order.config";
import type { Tier } from "../config/billing.config";
import { APP_DATA_NAMESPACE } from "./storefront-entitlements.server";

export const SETTINGS_KEY = "storefront_settings";
type Admin = {
  graphql(query: string, options?: { variables?: Record<string, unknown> }): Promise<Response>;
};

export async function getQuickOrderSettings(params: {
  admin: Admin;
  tier: Tier;
}): Promise<QuickOrderSettings> {
  const response = await params.admin.graphql(
    `#graphql query QuickOrderSettings { currentAppInstallation { settings: metafield(namespace: "${APP_DATA_NAMESPACE}", key: "${SETTINGS_KEY}") { value } } }`,
  );
  const json = (await response.json()) as any;
  if (!response.ok || json.errors?.length)
    throw new Error(
      json.errors?.map((e: any) => e.message).join("; ") || "Could not read quick order settings.",
    );
  const raw = json.data?.currentAppInstallation?.settings?.value;
  if (!raw) return normalizeQuickOrderSettings(DEFAULT_SETTINGS, params.tier);
  try {
    return normalizeQuickOrderSettings(JSON.parse(raw), params.tier);
  } catch {
    return normalizeQuickOrderSettings(DEFAULT_SETTINGS, params.tier);
  }
}

export async function saveQuickOrderSettings(params: {
  admin: Admin;
  tier: Tier;
  settings: unknown;
}) {
  const settings = normalizeQuickOrderSettings(params.settings, params.tier);
  const ownerResponse = await params.admin.graphql(
    `#graphql query QuickOrderSettingsOwner { currentAppInstallation { id } }`,
  );
  const ownerJson = (await ownerResponse.json()) as any;
  const ownerId = ownerJson.data?.currentAppInstallation?.id;
  if (!ownerId) throw new Error("Could not resolve current AppInstallation.");
  const response = await params.admin.graphql(
    `#graphql mutation SaveQuickOrderSettings($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`,
    {
      variables: {
        metafields: [
          {
            ownerId,
            namespace: APP_DATA_NAMESPACE,
            key: SETTINGS_KEY,
            type: "json",
            value: JSON.stringify(settings),
          },
        ],
      },
    },
  );
  const json = (await response.json()) as any;
  const errors = json.errors ?? json.data?.metafieldsSet?.userErrors ?? [];
  if (!response.ok || errors.length)
    throw new Error(
      errors
        .map((e: any) => e.message)
        .filter(Boolean)
        .join("; ") || "Could not save settings.",
    );
  return settings;
}
