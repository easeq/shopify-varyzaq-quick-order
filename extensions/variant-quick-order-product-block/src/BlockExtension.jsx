import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { selectedResourceId } from "../../../packages/shopify-admin-extension-core/src/index.js";
import {
  loadProductQuickOrder,
  saveProductQuickOrder,
} from "../../../packages/variant-quick-order-admin-extension/src/index.js";
export default () => render(<ProductQuickOrderBlock />, document.body);
function ProductQuickOrderBlock() {
  const productId = selectedResourceId(shopify);
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!productId) return;
    loadProductQuickOrder(productId)
      .then((loaded) => {
        setData(loaded);
        setConfig(loaded.config);
      })
      .catch((e) => setError(e.message));
  }, [productId]);
  if (!productId)
    return (
      <s-admin-block heading="Variant Quick Order">
        <s-banner tone="critical">No product context was provided.</s-banner>
      </s-admin-block>
    );
  if (error)
    return (
      <s-admin-block heading="Variant Quick Order">
        <s-banner tone="critical">{error}</s-banner>
      </s-admin-block>
    );
  if (!data || !config)
    return (
      <s-admin-block heading="Variant Quick Order">
        <s-stack direction="inline" gap="small">
          <s-spinner />
          <s-text>Loading quick order settings…</s-text>
        </s-stack>
      </s-admin-block>
    );
  const limit = data.limits?.configuredProducts;
  const blocked =
    config.enabled && !data.isConfigured && limit != null && data.configuredProducts >= limit;
  async function save() {
    if (blocked) return;
    setSaving(true);
    setError("");
    try {
      await saveProductQuickOrder(productId, config);
      setData({ ...data, isConfigured: config.enabled });
      shopify.toast.show("Quick order settings saved");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <s-admin-block heading="Variant Quick Order">
      <s-stack gap="base">
        {blocked ? (
          <s-banner tone="warning">
            The Free plan is limited to {limit} configured products. Upgrade to Starter for normal
            unlimited usage.
          </s-banner>
        ) : null}
        <s-checkbox
          label="Show quick order table for this product"
          checked={config.enabled}
          onChange={(event) => setConfig({ ...config, enabled: event.currentTarget.checked })}
        />
        <s-text-field
          label="Product-specific heading (optional)"
          value={config.heading}
          onInput={(event) => setConfig({ ...config, heading: event.currentTarget.value })}
        />
        <s-select
          label="Sort variants"
          value={config.sortBy}
          onChange={(event) => setConfig({ ...config, sortBy: event.currentTarget.value })}
        >
          <s-option value="global">Use global setting</s-option>
          <s-option value="position">Product position</s-option>
          <s-option value="title">Title</s-option>
          <s-option value="sku">SKU</s-option>
        </s-select>
        <s-select
          label="Sold-out variants"
          value={config.hideSoldOut}
          onChange={(event) => setConfig({ ...config, hideSoldOut: event.currentTarget.value })}
        >
          <s-option value="global">Use global setting</s-option>
          <s-option value="show">Show</s-option>
          <s-option value="hide">Hide</s-option>
        </s-select>
        <s-paragraph>
          {data.product.variantsCount?.count ?? 0} variants. Your {data.planDisplayName} plan
          renders up to {data.limits.storefrontVariants} variants for this product.
        </s-paragraph>
        {error ? <s-banner tone="critical">{error}</s-banner> : null}
        <s-button variant="primary" disabled={saving || blocked} onClick={() => void save()}>
          {saving ? "Saving…" : "Save"}
        </s-button>
      </s-stack>
    </s-admin-block>
  );
}
