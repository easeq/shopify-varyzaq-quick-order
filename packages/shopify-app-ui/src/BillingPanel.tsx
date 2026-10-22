export interface BillingPanelProps {
  status: string | null | undefined;
  displayName: string;
  activeDescription?: string | null;
  billingUrl: string;
  currentPeriodEnd?: string | Date | null;
}

export function BillingPanel({
  status,
  displayName,
  activeDescription,
  billingUrl,
  currentPeriodEnd,
}: BillingPanelProps) {
  const active = status === "active";

  return (
    <s-section heading="Billing and plan">
      <s-stack direction="block" gap="base">
        {active ? (
          <s-banner tone="success">
            Your store is subscribed to {activeDescription || displayName}.
          </s-banner>
        ) : (
          <s-banner tone="info">
            Select a plan to activate the app and unlock its features.
          </s-banner>
        )}

        <s-stack direction="inline" gap="base" alignItems="center">
          <s-badge tone="info">{displayName}</s-badge>

          {currentPeriodEnd ? (
            <s-paragraph>Billing period ends {formatDate(currentPeriodEnd)}.</s-paragraph>
          ) : null}
        </s-stack>

        <s-paragraph>
          Manage your subscription, review your current plan, or switch to a different plan at any
          time.
        </s-paragraph>

        <s-button variant="primary" target="_top" href={billingUrl}>
          Manage plan
        </s-button>
      </s-stack>
    </s-section>
  );
}

function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
