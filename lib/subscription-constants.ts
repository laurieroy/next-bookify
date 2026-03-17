export function getCurrentBillingPeriodStart(): Date {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
}
