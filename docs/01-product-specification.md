# Product specification

## Goal

Reduce friction for buyers ordering multiple variants of one product, especially wholesale/B2B products with size, color, pack or other variant matrices.

## Merchant requirements

Merchants can enable the feature per product; choose visible columns; rename standard column labels; sort by product position/title/SKU; hide sold-out rows; choose responsive cards or horizontal-table behavior; configure fallback min/max/increment/case-pack rules; and on Pro add barcode, rule/case-pack and up to eight variant metafield columns, CSV paste, search, B2B gating and per-variant fallback rules.

## Buyer requirements

The buyer sees only enabled products, enters integer quantities across rows, receives immediate validation against the effective rule and adds all valid selected variants in one action. Zero means unselected. Sold-out rows cannot be submitted.

## Non-goals

This is not a customer account, reorder-history, saved-list, catalog-wide order form or order database. It deliberately avoids storing customer profiles/order history. A future catalog-wide order pad can build on the same storefront and quantity-rule modules without forcing this product-page app to own that data model.
