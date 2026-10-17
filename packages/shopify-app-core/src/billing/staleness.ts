export function isSubscriptionStale(
  updatedAtShopify: Date | string | null | undefined,
  maxAgeHours = 24,
  now = new Date(),
): boolean {
  if (!updatedAtShopify) return true;

  const updated = updatedAtShopify instanceof Date ? updatedAtShopify : new Date(updatedAtShopify);

  if (Number.isNaN(updated.getTime())) return true;

  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return now.getTime() - updated.getTime() >= maxAgeMs;
}
