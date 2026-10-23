# Marketing assets and video

All banner assets are complete HTML documents at 1600×900 in the Zerqith visual style shared with the MezuraWise apps (deep teal `#102a2c`, lime `#c2f970`, framed icon, zerqith.com footer). They are self-contained—no external requests, stock photos or copied competitor artwork. Open `marketing/index.html` and use **Download PNG** on any banner or the icon; images are generated in the browser at click time.

The SVG icon uses the same framed Zerqith style as the other apps: a line-art cart holding rows of variants, in lime on deep teal. It exports to a 1200×1200 PNG from the gallery.

The Remotion project contains one 36-second `VariantQuickOrderPromo` composition. From the app root:

```bash
pnpm --dir marketing/remotion install
pnpm --dir marketing/remotion studio
pnpm --dir marketing/remotion typecheck
pnpm --dir marketing/remotion render
```

The render command writes `marketing/remotion/out/variant-quick-order-promo.mp4`.
