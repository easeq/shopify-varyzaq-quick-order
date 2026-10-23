import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const banners = [
  "quick-order-01-hero",
  "quick-order-02-how-it-works",
  "quick-order-03-merchant-setup",
  "quick-order-04-storefront-features",
  "quick-order-05-csv-pro",
  "quick-order-06-high-variants",
];

test("includes six 1600x900 Zerqith-style HTML banners with PNG export", async () => {
  for (const name of banners) {
    const html = await read(`marketing/banners/${name}.html`);
    assert.match(html, /width:1600px/);
    assert.match(html, /height:900px/);
    assert.match(html, /Download as PNG \(1600×900\)/);
    assert.doesNotMatch(html, /url\(['"]?https?:|<script[^>]+src=|<link[^>]+href=/i);
  }
  const featured = await read("marketing/featured/quick-order-featured-media.html");
  assert.match(featured, /Variant Quick Order/);
});

test("includes a Zerqith framed SVG icon and Remotion composition", async () => {
  const svg = await read("marketing/icons/variant-quick-order.svg");
  const root = await read("marketing/remotion/src/Root.tsx");
  assert.match(svg, /viewBox="0 0 128 128"/);
  assert.match(svg, /#102a2c/);
  assert.match(svg, /#c2f970/);
  assert.doesNotMatch(svg, /<linearGradient|<radialGradient|<filter|<image/i);
  assert.match(root, /VariantQuickOrderPromo/);
  assert.match(root, /durationInFrames=\{1080\}/);
});

test("submission pack documents reviewer steps, pricing and data minimization", async () => {
  const doc = await read("docs/APP_STORE_SUBMISSION.md");
  assert.match(doc, /Reviewer instructions/);
  assert.match(doc, /\$7\.99\/month/);
  assert.match(doc, /\$14\.99\/month/);
  assert.match(doc, /does not request customer or order scopes/);
});
