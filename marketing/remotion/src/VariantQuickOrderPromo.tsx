import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";

const C = {
  ink: "#15202B",
  green: "#46B98B",
  soft: "#E8F4EF",
  paper: "#F5F7F6",
  muted: "#66736E",
  line: "#CAD6D1",
  white: "#FFFFFF",
};
const Page: React.FC<React.PropsWithChildren<{ dark?: boolean }>> = ({
  dark = false,
  children,
}) => (
  <AbsoluteFill
    style={{
      background: dark ? C.ink : C.paper,
      color: dark ? C.white : C.ink,
      fontFamily: "Inter,Arial,sans-serif",
      padding: 96,
    }}
  >
    {children}
  </AbsoluteFill>
);
const Fade: React.FC<React.PropsWithChildren> = ({ children }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 16, 180, 205], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
const Pill: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span
    style={{ border: `2px solid ${C.line}`, borderRadius: 999, padding: "10px 15px", fontSize: 22 }}
  >
    {children}
  </span>
);

const Hero = () => (
  <Page>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.05fr",
        gap: 70,
        height: "100%",
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#237B5B",
          }}
        >
          Variant Quick Order
        </div>
        <h1 style={{ fontSize: 92, lineHeight: 0.96, letterSpacing: -6, margin: "28px 0" }}>
          Many variants.
          <br />
          <span style={{ color: "#16865F" }}>One fast order.</span>
        </h1>
        <p style={{ fontSize: 31, lineHeight: 1.45, color: C.muted, maxWidth: 700 }}>
          Enter quantities across a product table and add every selected variant to cart in one
          action.
        </p>
      </div>
      <OrderTable />
    </div>
  </Page>
);
const OrderTable = () => (
  <div
    style={{ background: C.white, border: `2px solid ${C.line}`, borderRadius: 28, padding: 30 }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      }}
    >
      <b style={{ fontSize: 34 }}>Quick order</b>
      <span style={{ fontSize: 22, color: C.muted }}>3 lines · 48 units</span>
    </div>
    {[
      ["Black / S", "TEE-BLK-S", "$12.40", "12"],
      ["Black / M", "TEE-BLK-M", "$12.40", "24"],
      ["Olive / M", "TEE-OLV-M", "$12.90", "12"],
      ["Stone / XL", "TEE-STN-XL", "$13.20", ""],
    ].map((r, i) => (
      <div
        key={i}
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr .9fr .65fr 100px",
          gap: 16,
          alignItems: "center",
          borderTop: `1px solid ${C.line}`,
          padding: "20px 4px",
          fontSize: 22,
        }}
      >
        <b>{r[0]}</b>
        <span style={{ fontFamily: "monospace", fontSize: 18 }}>{r[1]}</span>
        <span>{r[2]}</span>
        <span
          style={{
            border: `2px solid ${r[3] ? C.green : C.line}`,
            background: r[3] ? C.soft : C.white,
            borderRadius: 9,
            padding: "10px 0",
            textAlign: "center",
            fontWeight: 800,
          }}
        >
          {r[3]}
        </span>
      </div>
    ))}
    <div
      style={{
        marginTop: 26,
        background: C.ink,
        color: C.white,
        borderRadius: 11,
        padding: "17px 24px",
        textAlign: "center",
        fontSize: 22,
        fontWeight: 800,
      }}
    >
      Add selected to cart
    </div>
  </div>
);

const Controls = () => (
  <Page dark>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 80,
        height: "100%",
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 22,
            color: "#9ED9C2",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Merchant controls
        </div>
        <h2 style={{ fontSize: 78, lineHeight: 1, letterSpacing: -4, margin: "24px 0" }}>
          Columns, labels, rules and mobile layout.
        </h2>
        <p style={{ fontSize: 29, lineHeight: 1.5, color: "#CBD4D8" }}>
          Configure from Shopify Admin. Keep product-specific enablement on the product page.
        </p>
      </div>
      <div style={{ background: C.white, color: C.ink, borderRadius: 28, padding: 34 }}>
        <b style={{ fontSize: 34 }}>Storefront settings</b>
        <div style={{ marginTop: 28, display: "grid", gap: 16 }}>
          {["Options", "SKU", "Price", "Availability", "Quantity"].map((x) => (
            <div key={x} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: C.green,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                }}
              >
                ✓
              </span>
              {x}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 30,
            borderTop: `1px solid ${C.line}`,
            paddingTop: 26,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Pill>Custom labels</Pill>
          <Pill>Sorting</Pill>
          <Pill>Mobile cards</Pill>
        </div>
      </div>
    </div>
  </Page>
);

const Pro = () => (
  <Page>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.12fr .88fr",
        gap: 70,
        height: "100%",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: C.white,
          border: `2px solid ${C.line}`,
          borderRadius: 28,
          padding: 34,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b style={{ fontSize: 34 }}>Paste SKU and quantity</b>
          <span
            style={{
              background: C.ink,
              color: C.white,
              padding: "8px 15px",
              borderRadius: 999,
              fontWeight: 800,
            }}
          >
            PRO
          </span>
        </div>
        <div
          style={{
            marginTop: 28,
            background: "#F7F5F0",
            border: `2px solid ${C.line}`,
            borderRadius: 13,
            padding: 24,
            font: "26px/1.8 monospace",
          }}
        >
          TEE-BLK-S, 12
          <br />
          TEE-BLK-M, 24
          <br />
          TEE-OLV-M, 12
        </div>
        <div
          style={{
            marginTop: 22,
            background: C.ink,
            color: C.white,
            padding: "16px 22px",
            borderRadius: 10,
            width: "fit-content",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Apply quantities
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 22,
            color: "#237B5B",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Pro workflows
        </div>
        <h2 style={{ fontSize: 78, lineHeight: 1, letterSpacing: -4, margin: "24px 0" }}>
          Paste. Search. Order dense variant sets.
        </h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Pill>CSV / Excel paste</Pill>
          <Pill>Barcode</Pill>
          <Pill>Metafields</Pill>
          <Pill>B2B controls</Pill>
        </div>
      </div>
    </div>
  </Page>
);

const Scale = () => (
  <Page dark>
    <div style={{ height: "100%", display: "grid", alignContent: "center" }}>
      <div
        style={{
          fontSize: 22,
          color: "#9ED9C2",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        High-variant ready
      </div>
      <h2
        style={{
          fontSize: 82,
          lineHeight: 1,
          letterSpacing: -4,
          margin: "24px 0 48px",
          maxWidth: 1250,
        }}
      >
        Context-aware first render. Bounded pages after 250.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 26 }}>
        {[
          ["250", "Liquid rows first"],
          ["100", "Max rows per proxy page"],
          ["2,048", "Pro variant ceiling"],
        ].map(([n, t]) => (
          <div key={n} style={{ border: `2px solid #43535B`, borderRadius: 22, padding: 34 }}>
            <strong style={{ fontSize: 72, color: C.green }}>{n}</strong>
            <div style={{ fontSize: 25, marginTop: 8 }}>{t}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 25, color: "#CBD4D8", marginTop: 38 }}>
        For appended B2B rows, potentially uncontextualized prices are deferred to cart instead of
        presented as customer-specific pricing.
      </p>
    </div>
  </Page>
);

const End = () => (
  <Page>
    <div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: C.ink,
            margin: "0 auto 32px",
            display: "grid",
            placeItems: "center",
            fontSize: 54,
            color: C.green,
          }}
        >
          ▦
        </div>
        <h2 style={{ fontSize: 88, lineHeight: 1, letterSpacing: -5, margin: 0 }}>
          Variant Quick Order
        </h2>
        <p style={{ fontSize: 30, color: C.muted, margin: "24px 0 0" }}>
          A faster product-page order table for B2B, wholesale and multi-variant products.
        </p>
      </div>
    </div>
  </Page>
);

export const VariantQuickOrderPromo: React.FC = () => (
  <AbsoluteFill>
    {[
      [0, 210, <Hero />],
      [210, 210, <Controls />],
      [420, 240, <Pro />],
      [660, 240, <Scale />],
      [900, 180, <End />],
    ].map(([from, duration, scene], i) => (
      <Sequence key={i} from={from as number} durationInFrames={duration as number}>
        <Fade>{scene as React.ReactNode}</Fade>
      </Sequence>
    ))}
  </AbsoluteFill>
);
