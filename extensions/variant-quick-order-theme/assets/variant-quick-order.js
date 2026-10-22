(() => {
  const boot = () => document.querySelectorAll("[data-vqo-root]").forEach(init);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  document.addEventListener("shopify:section:load", boot);

  function init(root) {
    if (root.dataset.vqoReady === "true") return;
    root.dataset.vqoReady = "true";

    const settings = parse(root.dataset.settings) || {};
    const productConfig = parse(root.dataset.productConfig) || {};
    const capabilities = new Set(
      String(root.dataset.capabilities || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );
    const isB2B = root.dataset.b2b === "true";
    const variantCount = positiveInteger(root.dataset.variantCount, 0);
    const maxVariants = capabilities.has("large_variant_sets")
      ? 2048
      : root.dataset.plan === "free"
        ? 50
        : 250;
    const metafieldColumns = Array.isArray(settings.metafieldColumns)
      ? settings.metafieldColumns
      : [];
    const quantities = new Map();
    const rawInitial = parse(root.querySelector("[data-vqo-variants]")?.textContent) || [];
    let variants = rawInitial.map(normalizeVariant);
    let filterText = "";

    const elements = {
      head: root.querySelector("[data-vqo-head]"),
      body: root.querySelector("[data-vqo-body]"),
      cards: root.querySelector("[data-vqo-cards]"),
      tableWrap: root.querySelector("[data-vqo-table-wrap]"),
      add: root.querySelector("[data-vqo-add]"),
      status: root.querySelector("[data-vqo-status]"),
      summary: root.querySelector("[data-vqo-summary]"),
      search: root.querySelector("[data-vqo-search]"),
      searchWrap: root.querySelector("[data-vqo-search-wrap]"),
      csv: root.querySelector("[data-vqo-csv]"),
      csvInput: root.querySelector("[data-vqo-csv-input]"),
      applyCsv: root.querySelector("[data-vqo-apply-csv]"),
      proTools: root.querySelector("[data-vqo-pro-tools]"),
    };

    root.dataset.mobileLayout = settings.mobileLayout === "scroll" ? "scroll" : "cards";
    if (capabilities.has("b2b_controls") && settings.showSearch) {
      elements.proTools.hidden = false;
      elements.searchWrap.hidden = false;
    }
    if (capabilities.has("csv_paste")) {
      elements.proTools.hidden = false;
      elements.csv.hidden = false;
    }

    elements.search?.addEventListener("input", (event) => {
      filterText = String(event.currentTarget.value || "")
        .trim()
        .toLowerCase();
      render();
    });
    elements.applyCsv?.addEventListener("click", applyCsv);
    elements.add?.addEventListener("click", addSelected);
    root.addEventListener("input", onQuantityInput);
    root.addEventListener("change", onQuantityInput);

    render();
    void loadLargeVariantSet();

    function normalizeVariant(raw, index = 0) {
      const gid = String(raw.gid || raw.id || "");
      const id = String(raw.id || "").startsWith("gid://")
        ? gid.split("/").pop()
        : String(raw.id || "");
      const rawMetafields = raw.metafields;
      const metafields = Array.isArray(rawMetafields)
        ? Object.fromEntries(
            metafieldColumns.map((column) => {
              const match = rawMetafields.find(
                (field) => field?.namespace === column.namespace && field?.key === column.key,
              );
              return [column.id, match?.value ?? null];
            }),
          )
        : rawMetafields || {};
      const priceBreaks = Array.isArray(raw.priceBreaks)
        ? raw.priceBreaks
        : Array.isArray(raw.quantityPriceBreaks?.nodes)
          ? raw.quantityPriceBreaks.nodes.map((entry) => ({
              minimumQuantity: entry.minimumQuantity,
              priceFormatted: formatMoney(entry.price),
            }))
          : [];

      return {
        position: index,
        id,
        gid,
        title: String(raw.title || ""),
        sku: String(raw.sku || ""),
        barcode: String(raw.barcode || ""),
        available: raw.available ?? raw.availableForSale ?? false,
        inventoryQuantity: raw.inventoryQuantity ?? raw.quantityAvailable ?? null,
        selectedOptions: Array.isArray(raw.selectedOptions) ? raw.selectedOptions : [],
        priceFormatted: raw.priceFormatted || formatMoney(raw.price),
        shopifyRule: raw.shopifyRule || raw.quantityRule || null,
        priceBreaks,
        appRule: raw.appRule || null,
        metafields,
        source: raw.source || "liquid",
      };
    }

    function resolveRule(variant) {
      const globalRule = normalizeRule(settings.defaultRule || {});
      const appRule = hasAnyRule(variant.appRule) ? normalizeRule(variant.appRule) : null;
      const nativeRule = normalizeRule(variant.shopifyRule || {});
      const meaningfulNative =
        nativeRule.minimum > 1 || nativeRule.increment > 1 || nativeRule.maximum != null;
      const canUseNative = !(isB2B && variant.source === "proxy");
      const base = appRule || globalRule;

      if (settings.preferShopifyB2BRules !== false && canUseNative && meaningfulNative) {
        return {
          minimum: nativeRule.minimum,
          maximum: nativeRule.maximum,
          increment: nativeRule.increment,
          casePack: base.casePack,
        };
      }
      return base;
    }

    function effectiveSettings() {
      return {
        sortBy:
          productConfig.sortBy && productConfig.sortBy !== "global"
            ? productConfig.sortBy
            : settings.sortBy || "position",
        sortDirection: settings.sortDirection === "desc" ? "desc" : "asc",
        hideSoldOut:
          productConfig.hideSoldOut === "hide"
            ? true
            : productConfig.hideSoldOut === "show"
              ? false
              : settings.hideSoldOut === true,
      };
    }

    function visibleVariants() {
      const effective = effectiveSettings();
      const filtered = variants.filter((variant) => {
        if (effective.hideSoldOut && !variant.available) return false;
        if (!filterText) return true;
        const haystack = [
          variant.title,
          variant.sku,
          variant.barcode,
          ...variant.selectedOptions.map((option) => option.value),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(filterText);
      });
      const direction = effective.sortDirection === "desc" ? -1 : 1;
      const sortBy = effective.sortBy;
      return filtered.sort((a, b) => {
        if (sortBy === "position") return (a.position - b.position) * direction;
        const left = String(sortBy === "sku" ? a.sku : a.title).toLocaleLowerCase();
        const right = String(sortBy === "sku" ? b.sku : b.title).toLocaleLowerCase();
        return (
          left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }) * direction
        );
      });
    }

    function columns() {
      const standard = Array.isArray(settings.visibleColumns)
        ? settings.visibleColumns
        : ["options", "sku", "price", "inventory", "quantity"];
      const result = standard.map((id) => ({ id, label: labelFor(id), metafield: false }));
      if (capabilities.has("advanced_columns")) {
        for (const column of metafieldColumns) {
          result.splice(Math.max(0, result.length - 1), 0, {
            id: column.id,
            label: column.label || column.key,
            metafield: true,
          });
        }
      }
      return result;
    }

    function labelFor(id) {
      const fallback = {
        options: "Options",
        sku: "SKU",
        barcode: "Barcode",
        price: "Price",
        inventory: "Availability",
        casePack: "Case / pack",
        quantityRule: "Quantity rule",
        quantity: "Quantity",
      };
      return settings.columnLabels?.[id] || fallback[id] || id;
    }

    function render() {
      const rows = visibleVariants();
      const cols = columns();
      elements.head.innerHTML = `<tr>${cols.map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`).join("")}</tr>`;
      elements.body.innerHTML = rows.length
        ? rows
            .map(
              (variant) =>
                `<tr data-vqo-row="${escapeHtml(variant.id)}">${cols.map((column) => `<td>${cell(variant, column)}</td>`).join("")}</tr>`,
            )
            .join("")
        : `<tr><td colspan="${cols.length}"><div class="vqo-empty">No matching variants.</div></td></tr>`;
      elements.cards.innerHTML = rows.length
        ? rows.map(card).join("")
        : `<div class="vqo-empty">No matching variants.</div>`;
      updateSummary();
    }

    function cell(variant, column) {
      if (column.metafield) return escapeHtml(variant.metafields?.[column.id] ?? "—");
      const rule = resolveRule(variant);
      switch (column.id) {
        case "options":
          return `<div class="vqo-options">${variant.selectedOptions.map((option) => `<span class="vqo-option">${escapeHtml(option.value)}</span>`).join("")}</div>`;
        case "sku":
          return escapeHtml(variant.sku || "—");
        case "barcode":
          return escapeHtml(variant.barcode || "—");
        case "price":
          return isB2B && variant.source === "proxy"
            ? `<span class="vqo-rule">Calculated in cart</span>`
            : escapeHtml(variant.priceFormatted || "—");
        case "inventory":
          if (!variant.available)
            return `<span class="vqo-stock" data-sold-out="true">Sold out</span>`;
          if (
            settings.inventoryDisplay === "quantity" &&
            Number.isFinite(Number(variant.inventoryQuantity))
          ) {
            return `<span class="vqo-stock">${Math.max(0, Number(variant.inventoryQuantity))} available</span>`;
          }
          return `<span class="vqo-stock">In stock</span>`;
        case "casePack":
          return rule.casePack ? escapeHtml(rule.casePack) : "—";
        case "quantityRule":
          return `<span class="vqo-rule">Min ${rule.minimum}${rule.maximum != null ? ` · Max ${rule.maximum}` : ""}${rule.increment > 1 ? ` · Step ${rule.increment}` : ""}</span>`;
        case "quantity":
          return quantityInput(variant, rule);
        default:
          return "—";
      }
    }

    function card(variant) {
      const rule = resolveRule(variant);
      return `<div class="vqo-card" data-vqo-row="${escapeHtml(variant.id)}">
        <div class="vqo-card-main">
          <strong>${escapeHtml(variant.selectedOptions.map((option) => option.value).join(" / ") || variant.title)}</strong>
          <div class="vqo-card-meta">
            ${variant.sku ? `<span>${escapeHtml(variant.sku)}</span>` : ""}
            <span>${isB2B && variant.source === "proxy" ? "Calculated in cart" : escapeHtml(variant.priceFormatted || "")}</span>
            <span>${variant.available ? "In stock" : "Sold out"}</span>
            ${rule.casePack ? `<span>Pack ${rule.casePack}</span>` : ""}
          </div>
        </div>
        <div>${quantityInput(variant, rule)}</div>
      </div>`;
    }

    function quantityInput(variant, rule) {
      const value = quantities.get(variant.id) || 0;
      const error = validateQuantity(value, rule);
      return `<input
        class="vqo-qty"
        data-vqo-qty="${escapeHtml(variant.id)}"
        type="number"
        inputmode="numeric"
        min="0"
        step="${rule.increment}"
        placeholder="${rule.minimum}"
        value="${value || ""}"
        ${variant.available ? "" : "disabled"}
        aria-label="${escapeHtml(`${labelFor("quantity")} for ${variant.title || variant.sku}`)}"
        aria-invalid="${error ? "true" : "false"}"
      />`;
    }

    function onQuantityInput(event) {
      const input = event.target.closest?.("[data-vqo-qty]");
      if (!input) return;
      const id = String(input.dataset.vqoQty || "");
      const quantity = nonNegativeInteger(input.value);
      if (quantity <= 0) quantities.delete(id);
      else quantities.set(id, quantity);
      const variant = variants.find((item) => item.id === id);
      const error = variant ? validateQuantity(quantity, resolveRule(variant)) : null;
      root.querySelectorAll(`[data-vqo-qty="${cssEscape(id)}"]`).forEach((mirror) => {
        if (mirror !== input) mirror.value = quantity || "";
        mirror.setAttribute("aria-invalid", error ? "true" : "false");
      });
      elements.status.textContent = error || "";
      updateSummary();
    }

    function updateSummary() {
      let lines = 0;
      let units = 0;
      let invalid = 0;
      for (const [id, quantity] of quantities) {
        const variant = variants.find((item) => item.id === id);
        if (!variant || quantity <= 0) continue;
        lines += 1;
        units += quantity;
        if (validateQuantity(quantity, resolveRule(variant))) invalid += 1;
      }
      elements.add.disabled = lines === 0 || invalid > 0;
      elements.summary.textContent =
        settings.showTotals === false || lines === 0
          ? ""
          : `${lines} line${lines === 1 ? "" : "s"} · ${units} unit${units === 1 ? "" : "s"}`;
    }

    async function addSelected() {
      const items = [];
      const errors = [];
      for (const [id, quantity] of quantities) {
        if (quantity <= 0) continue;
        const variant = variants.find((item) => item.id === id);
        if (!variant) continue;
        const error = validateQuantity(quantity, resolveRule(variant));
        if (error) {
          errors.push(`${variant.sku || variant.title}: ${error}`);
          continue;
        }
        items.push({ id, quantity });
      }
      if (errors.length) {
        elements.status.textContent = errors[0];
        return;
      }
      if (!items.length) return;

      elements.add.disabled = true;
      elements.status.textContent = `Adding ${items.length} variant${items.length === 1 ? "" : "s"}…`;
      try {
        const response = await fetch(`${window.Shopify?.routes?.root || "/"}cart/add.js`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            items,
            sections: ["cart-icon-bubble", "cart-drawer", "cart-live-region-text", "cart-footer"],
            sections_url: location.pathname,
          }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.description || data.message || "Could not add variants to cart.");
        updateSections(data.sections || {});
        quantities.clear();
        render();
        elements.status.textContent = `Added ${items.length} variant${items.length === 1 ? "" : "s"} to cart.`;
        document.dispatchEvent(
          new CustomEvent("variant-quick-order:added", { detail: { items, response: data } }),
        );
        document.dispatchEvent(new CustomEvent("cart:refresh", { bubbles: true }));
      } catch (error) {
        elements.status.textContent =
          error instanceof Error ? error.message : "Could not add variants to cart.";
      } finally {
        updateSummary();
      }
    }

    function applyCsv() {
      const text = String(elements.csvInput?.value || "").trim();
      if (!text) return;
      let applied = 0;
      const problems = [];
      for (const [lineIndex, line] of text.split(/\r?\n/).entries()) {
        if (!line.trim()) continue;
        const parts = line.split(/[\t,;]/).map((value) => value.trim().replace(/^['"]|['"]$/g, ""));
        if (parts.length < 2) {
          problems.push(`Line ${lineIndex + 1}`);
          continue;
        }
        const identifier = parts[0];
        const quantity = nonNegativeInteger(parts[1]);
        if (
          lineIndex === 0 &&
          /^(sku|barcode|variant|variant id)$/i.test(identifier) &&
          !Number.isFinite(Number(parts[1]))
        )
          continue;
        const variant = variants.find(
          (item) =>
            item.sku === identifier ||
            item.barcode === identifier ||
            item.id === identifier ||
            item.gid === identifier,
        );
        if (!variant || quantity <= 0 || validateQuantity(quantity, resolveRule(variant))) {
          problems.push(`Line ${lineIndex + 1}`);
          continue;
        }
        quantities.set(variant.id, quantity);
        applied += 1;
      }
      render();
      elements.status.textContent = problems.length
        ? `Applied ${applied}; check ${problems.slice(0, 3).join(", ")}${problems.length > 3 ? "…" : ""}.`
        : `Applied quantities to ${applied} variant${applied === 1 ? "" : "s"}.`;
    }

    async function loadLargeVariantSet() {
      if (!capabilities.has("large_variant_sets") || variantCount <= variants.length) return;
      const target = Math.min(variantCount, maxVariants);
      let after = null;
      let hasNextPage = true;
      let pages = 0;
      const seen = new Set(
        variants.map((variant) => variant.gid || `gid://shopify/ProductVariant/${variant.id}`),
      );
      elements.status.textContent = `Loading ${target} variants…`;

      try {
        while (hasNextPage && variants.length < target && pages < 24) {
          const query = new URLSearchParams({
            handle: root.dataset.productHandle || "",
            first: "100",
          });
          if (after) query.set("after", after);
          if (root.dataset.country) query.set("country", root.dataset.country);
          const proxyPath = String(root.dataset.proxyPath || "/apps/variant-quick-order").replace(
            /\/$/,
            "",
          );
          const response = await fetch(`${proxyPath}/variants?${query}`, {
            headers: { Accept: "application/json" },
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not load the remaining variants.");

          for (const raw of data.variants || []) {
            const variant = normalizeVariant(raw, variants.length);
            if (!variant.gid || seen.has(variant.gid)) continue;
            seen.add(variant.gid);
            variants.push(variant);
            if (variants.length >= target) break;
          }
          after = data.pageInfo?.endCursor || null;
          hasNextPage = Boolean(data.pageInfo?.hasNextPage && after);
          pages += 1;
        }
        elements.status.textContent =
          variants.length < variantCount
            ? `Showing ${variants.length} of ${variantCount} variants for this plan.`
            : "";
        render();
      } catch (error) {
        elements.status.textContent =
          error instanceof Error ? error.message : "Could not load all variants.";
      }
    }

    function updateSections(sections) {
      for (const [id, html] of Object.entries(sections)) {
        if (!html) continue;
        const current = document.getElementById(id);
        if (!current) continue;
        const parsed = new DOMParser().parseFromString(String(html), "text/html");
        const replacement = parsed.getElementById(id) || parsed.body.firstElementChild;
        if (replacement) current.replaceWith(replacement);
      }
    }

    function formatMoney(value) {
      if (value && typeof value === "object" && value.amount != null) {
        const amount = Number(value.amount);
        if (!Number.isFinite(amount)) return "";
        try {
          return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: value.currencyCode || "USD",
          }).format(amount);
        } catch {
          return `${amount.toFixed(2)} ${value.currencyCode || ""}`.trim();
        }
      }
      return "";
    }
  }

  function normalizeRule(rule) {
    const increment = positiveInteger(rule?.increment, 1);
    const rawMinimum = positiveInteger(rule?.minimum, increment);
    const minimum = Math.ceil(rawMinimum / increment) * increment;
    let maximum = optionalPositiveInteger(rule?.maximum);
    if (maximum != null) {
      maximum = Math.floor(maximum / increment) * increment;
      if (maximum < minimum) maximum = minimum;
    }
    return {
      minimum,
      maximum,
      increment,
      casePack: optionalPositiveInteger(rule?.casePack),
    };
  }

  function validateQuantity(quantity, rule) {
    if (quantity === 0) return null;
    if (quantity < rule.minimum) return `Minimum is ${rule.minimum}.`;
    if (rule.maximum != null && quantity > rule.maximum) return `Maximum is ${rule.maximum}.`;
    if (quantity % rule.increment !== 0) return `Use increments of ${rule.increment}.`;
    return null;
  }

  function hasAnyRule(rule) {
    return Boolean(
      rule &&
      ["minimum", "maximum", "increment", "casePack"].some(
        (key) => rule[key] != null && rule[key] !== "",
      ),
    );
  }

  function nonNegativeInteger(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : 0;
  }
  function positiveInteger(value, fallback) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : fallback;
  }
  function optionalPositiveInteger(value) {
    if (value == null || value === "") return null;
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }
  function parse(value) {
    try {
      return JSON.parse(value || "null");
    } catch {
      return null;
    }
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[char],
    );
  }
  function cssEscape(value) {
    return window.CSS?.escape ? CSS.escape(String(value)) : String(value).replace(/"/g, '\\"');
  }
})();
