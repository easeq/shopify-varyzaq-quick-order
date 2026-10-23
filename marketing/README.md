# Variant Quick Order marketing — Zerqith style

- `banners/` — 6 banners (1600×900): hero, how it works, merchant setup, storefront features, CSV paste (Pro), high variant counts (Pro).
- `featured/` — one featured media page (1600×900) for the app listing.
- `icons/` — the app icon (SVG), in the same Zerqith framed style as the MezuraWise apps.
- `remotion/` — 36-second 1920×1080 promotional video source.
- `index.html` — preview gallery. Each item has **Open page** and **Download PNG**.

PNGs are not stored. Every banner/featured page has a "Download as PNG (1600×900)" button, and the index triggers the same export; the image is generated in the browser at click time. The icon exports to a 1200×1200 PNG the same way (or download the SVG).

All pages are self-contained HTML/inline SVG with system fonts and no external requests.
