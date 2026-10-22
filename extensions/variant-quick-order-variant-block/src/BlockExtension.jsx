import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { selectedResourceId } from "../../../packages/shopify-admin-extension-core/src/index.js";
import {
  loadVariantQuickOrder,
  saveVariantQuickOrder,
} from "../../../packages/variant-quick-order-admin-extension/src/index.js";
export default () => render(<VariantQuickOrderBlock />, document.body);
function VariantQuickOrderBlock() {
  const id = selectedResourceId(shopify);
  const [data, setData] = useState(null);
  const [rule, setRule] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!id) return;
    loadVariantQuickOrder(id)
      .then((loaded) => {
        setData(loaded);
        setRule(loaded.rule);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  if (error)
    return (
      <s-admin-block heading="Variant Quick Order">
        <s-banner tone="critical">{error}</s-banner>
      </s-admin-block>
    );
  if (!data || !rule)
    return (
      <s-admin-block heading="Variant Quick Order">
        <s-spinner />
      </s-admin-block>
    );
  if (!data.capabilities.has("variant_rule_overrides"))
    return (
      <s-admin-block heading="Variant Quick Order">
        <s-banner tone="info">
          Variant-level case-pack and quantity rule overrides are available on Pro. Starter uses the
          global fallback rule plus native Shopify B2B quantity rules.
        </s-banner>
      </s-admin-block>
    );
  const field = (key, label) => (
    <s-text-field
      type="number"
      label={label}
      value={rule[key] == null ? "" : String(rule[key])}
      onInput={(event) => setRule({ ...rule, [key]: event.currentTarget.value })}
    />
  );
  async function save() {
    setSaving(true);
    try {
      await saveVariantQuickOrder(id, rule);
      shopify.toast.show("Variant quick order rule saved");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <s-admin-block heading="Variant Quick Order">
      <s-stack gap="base">
        <s-paragraph>
          These values are app fallbacks. When “Prefer native Shopify B2B quantity rules” is
          enabled, Shopify catalog rules take precedence.
        </s-paragraph>
        {field("minimum", "Minimum quantity")}
        {field("maximum", "Maximum quantity (optional)")}
        {field("increment", "Increment")}
        {field("casePack", "Case / pack quantity (optional)")}
        <s-button variant="primary" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save"}
        </s-button>
      </s-stack>
    </s-admin-block>
  );
}
