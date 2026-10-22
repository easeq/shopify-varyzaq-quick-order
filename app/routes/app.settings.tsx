import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { Capability, hasCapability } from "../config/billing.config";
import { DEFAULT_COLUMN_LABELS, type StandardColumnId } from "../config/quick-order.config";
import { getAdminExtensionEntitlements } from "../services/admin-extension-entitlements.server";
import {
  getQuickOrderSettings,
  saveQuickOrderSettings,
} from "../services/quick-order-settings.server";
import { authenticate } from "../shopify.server";

const STANDARD_COLUMNS: StandardColumnId[] = ["options", "sku", "price", "inventory", "quantity"];
const PRO_COLUMNS: StandardColumnId[] = ["barcode", "casePack", "quantityRule"];

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  if (!session.accessToken) throw new Error("Missing access token.");
  const entitlements = await getAdminExtensionEntitlements({
    shop: session.shop,
    adminAccessToken: session.accessToken,
  });
  return {
    entitlements,
    settings: await getQuickOrderSettings({ admin, tier: entitlements.tier }),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);
    if (!session.accessToken) throw new Error("Missing access token.");
    const entitlements = await getAdminExtensionEntitlements({
      shop: session.shop,
      adminAccessToken: session.accessToken,
    });
    const form = await request.formData();
    const columns = form.getAll("columns").map(String);
    const metafieldColumns = Array.from({ length: 8 }, (_, i) => i).flatMap((i) => {
      const namespace = String(form.get(`metafieldNamespace${i}`) ?? "").trim();
      const key = String(form.get(`metafieldKey${i}`) ?? "").trim();
      const label = String(form.get(`metafieldLabel${i}`) ?? "").trim();
      return namespace && key ? [{ id: `mf-${i + 1}`, namespace, key, label: label || key }] : [];
    });
    const columnLabels = Object.fromEntries(
      Object.keys(DEFAULT_COLUMN_LABELS).map((id) => [id, form.get(`label_${id}`)]),
    );
    const settings = await saveQuickOrderSettings({
      admin,
      tier: entitlements.tier,
      settings: {
        heading: form.get("heading"),
        addButtonLabel: form.get("addButtonLabel"),
        csvLabel: form.get("csvLabel"),
        columnLabels,
        visibleColumns: columns,
        metafieldColumns,
        sortBy: form.get("sortBy"),
        sortDirection: form.get("sortDirection"),
        mobileLayout: form.get("mobileLayout"),
        hideSoldOut: form.get("hideSoldOut") === "on",
        showSearch: form.get("showSearch") === "on",
        showTotals: form.get("showTotals") === "on",
        inventoryDisplay: form.get("inventoryDisplay"),
        preferShopifyB2BRules: form.get("preferShopifyB2BRules") === "on",
        requireLoggedInCustomer: form.get("requireLoggedInCustomer") === "on",
        requireB2BCompany: form.get("requireB2BCompany") === "on",
        defaultRule: {
          minimum: form.get("minimum"),
          maximum: form.get("maximum"),
          increment: form.get("increment"),
          casePack: form.get("casePack"),
        },
      },
    });
    return { ok: true as const, message: "Storefront settings saved.", settings };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not save settings.",
    };
  }
}

export default function Settings() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const s = data.settings;
  const pro = hasCapability(data.entitlements.tier, Capability.ADVANCED_COLUMNS);
  const labels = hasCapability(data.entitlements.tier, Capability.CUSTOM_LABELS);
  const b2b = hasCapability(data.entitlements.tier, Capability.B2B_CONTROLS);
  const check = (id: string) => s.visibleColumns.includes(id as StandardColumnId);

  return (
    <s-page heading="Storefront settings">
      <fetcher.Form method="post">
        <s-stack gap="base">
          {fetcher.data?.message ? (
            <s-banner tone="success">{fetcher.data.message}</s-banner>
          ) : null}
          {fetcher.data?.error ? <s-banner tone="critical">{fetcher.data.error}</s-banner> : null}

          <s-section heading="Labels and layout">
            <s-stack gap="base">
              <s-text-field label="Heading" name="heading" value={s.heading} />
              <s-text-field
                label="Add-to-cart button"
                name="addButtonLabel"
                value={s.addButtonLabel}
              />
              <s-select label="Sort variants by" name="sortBy" value={s.sortBy}>
                <s-option value="position">Product position</s-option>
                <s-option value="title">Variant title</s-option>
                <s-option value="sku">SKU</s-option>
              </s-select>
              <s-select label="Sort direction" name="sortDirection" value={s.sortDirection}>
                <s-option value="asc">Ascending</s-option>
                <s-option value="desc">Descending</s-option>
              </s-select>
              <s-select label="Mobile layout" name="mobileLayout" value={s.mobileLayout}>
                <s-option value="cards">Compact cards</s-option>
                <s-option value="scroll">Scrollable table</s-option>
              </s-select>
              <s-checkbox
                name="hideSoldOut"
                checked={s.hideSoldOut}
                label="Hide sold-out variants"
              />
              <s-checkbox
                name="showTotals"
                checked={s.showTotals}
                label="Show selected line and quantity totals"
              />
            </s-stack>
          </s-section>

          <s-section heading="Columns">
            <s-stack gap="small">
              {STANDARD_COLUMNS.map((id) => (
                <s-checkbox
                  key={id}
                  name="columns"
                  value={id}
                  checked={check(id)}
                  label={s.columnLabels[id]}
                />
              ))}
              {pro ? (
                <>
                  {PRO_COLUMNS.map((id) => (
                    <s-checkbox
                      key={id}
                      name="columns"
                      value={id}
                      checked={check(id)}
                      label={s.columnLabels[id]}
                    />
                  ))}
                  <s-select
                    label="Inventory display"
                    name="inventoryDisplay"
                    value={s.inventoryDisplay}
                  >
                    <s-option value="status">In stock / sold out</s-option>
                    <s-option value="quantity">Exact quantity when Shopify exposes it</s-option>
                  </s-select>
                </>
              ) : (
                <s-banner tone="info">
                  Barcode, case-pack/rule and selected metafield columns are Pro features.
                </s-banner>
              )}
            </s-stack>
          </s-section>

          {labels ? (
            <s-section heading="Column labels">
              <s-stack gap="base">
                {[...STANDARD_COLUMNS, ...(pro ? PRO_COLUMNS : [])].map((id) => (
                  <s-text-field
                    key={id}
                    label={`${DEFAULT_COLUMN_LABELS[id]} label`}
                    name={`label_${id}`}
                    value={s.columnLabels[id]}
                  />
                ))}
              </s-stack>
            </s-section>
          ) : null}

          <s-section heading="Quantity rules">
            <s-stack gap="base">
              <s-paragraph>
                These are fallback rules. Native Shopify B2B quantity rules take precedence by
                default, so this module can later be shared with the dedicated MOQ/case-pack app
                without duplicating rule semantics.
              </s-paragraph>
              <s-text-field
                type="number"
                label="Minimum"
                name="minimum"
                value={String(s.defaultRule.minimum)}
              />
              <s-text-field
                type="number"
                label="Maximum (optional)"
                name="maximum"
                value={s.defaultRule.maximum == null ? "" : String(s.defaultRule.maximum)}
              />
              <s-text-field
                type="number"
                label="Increment"
                name="increment"
                value={String(s.defaultRule.increment)}
              />
              <s-text-field
                type="number"
                label="Case / pack quantity (optional)"
                name="casePack"
                value={s.defaultRule.casePack == null ? "" : String(s.defaultRule.casePack)}
              />
              <s-checkbox
                name="preferShopifyB2BRules"
                checked={s.preferShopifyB2BRules}
                label="Prefer native Shopify B2B quantity rules"
              />
            </s-stack>
          </s-section>

          {pro ? (
            <s-section heading="Selected variant metafields">
              <s-stack gap="base">
                <s-paragraph>
                  Add up to eight variant metafield columns. Use the namespace and key exactly as
                  defined in Shopify.
                </s-paragraph>
                {Array.from({ length: 8 }, (_, i) => {
                  const mf = s.metafieldColumns[i];
                  return (
                    <s-stack key={i} direction="inline" gap="small">
                      <s-text-field
                        label="Namespace"
                        name={`metafieldNamespace${i}`}
                        value={mf?.namespace ?? ""}
                      />
                      <s-text-field label="Key" name={`metafieldKey${i}`} value={mf?.key ?? ""} />
                      <s-text-field
                        label="Label"
                        name={`metafieldLabel${i}`}
                        value={mf?.label ?? ""}
                      />
                    </s-stack>
                  );
                })}
              </s-stack>
            </s-section>
          ) : null}

          {b2b ? (
            <s-section heading="B2B controls">
              <s-stack gap="base">
                <s-checkbox name="showSearch" checked={s.showSearch} label="Show variant search" />
                <s-checkbox
                  name="requireLoggedInCustomer"
                  checked={s.requireLoggedInCustomer}
                  label="Only show quick order to logged-in customers"
                />
                <s-checkbox
                  name="requireB2BCompany"
                  checked={s.requireB2BCompany}
                  label="Only show quick order when Liquid exposes a B2B company context"
                />
                <s-text-field label="CSV / paste label" name="csvLabel" value={s.csvLabel} />
              </s-stack>
            </s-section>
          ) : null}

          <s-button variant="primary" type="submit">
            Save settings
          </s-button>
        </s-stack>
      </fetcher.Form>
    </s-page>
  );
}
