# Marketing assets and video

All banner assets are complete HTML documents at 1600×900 with flat vector/CSS composition—no gradients, stock photos or copied competitor artwork. Open a banner in a Chromium browser at 1600×900 and capture/export the viewport.

The SVG icon is intentionally simple: a four-row variant grid feeding a single cart/add action. It can be rasterized after final brand color decisions without changing geometry.

The Remotion project contains one 36-second `VariantQuickOrderPromo` composition. From the app root:

```bash
pnpm --dir marketing/remotion install
pnpm marketing:studio
pnpm marketing:typecheck
pnpm marketing:render
```

The render command writes `marketing/remotion/out/variant-quick-order-promo.mp4`.
