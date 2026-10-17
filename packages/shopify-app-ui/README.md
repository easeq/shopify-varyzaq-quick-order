# @app-platform/shopify-ui

Reusable embedded-admin UI for apps built on the App Platform foundation.

The package uses Shopify App Home web components (`<s-...>`) and keeps authorization decisions on the server. UI gating is presentation only.

## BillingPanel

`BillingPanel` renders a concise current-plan status and a Shopify-hosted plan-management action. The app route remains responsible for authentication, authoritative billing refresh, and plan resolution.

```tsx
import { BillingPanel } from "@app-platform/shopify-ui";

<BillingPanel
  status={subscription?.status}
  displayName="Starter"
  activeDescription={activeDescription}
  billingUrl={billingUrl}
  currentPeriodEnd={subscription?.currentPeriodEnd}
/>;
```
