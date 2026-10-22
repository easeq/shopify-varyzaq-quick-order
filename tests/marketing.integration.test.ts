import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("includes four flat 1600x900 HTML banners", async () => {
  for (const name of ["01-hero", "02-configure", "03-csv-pro", "04-high-variants"]) {
    const html = await read(`marketing/banners/${name}.html`);
    assert.match(html, /width:1600px/);
    assert.match(html, /height:900px/);
    assert.doesNotMatch(html, /linear-gradient|radial-gradient|url\(['"]?https?:/i);
  }
});

test("includes a flat SVG icon and Remotion composition", async () => {
  const svg = await read("marketing/icons/variant-quick-order.svg");
  const root = await read("marketing/remotion/src/Root.tsx");
  assert.match(svg, /viewBox="0 0 1200 1200"/);
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
