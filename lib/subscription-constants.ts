export function getCurrentBillingPeriodStart(): Date {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
}

export const PLANS = {
  FREE: "free",
  STANDARD: "standard",
  PRO: "pro",
} as const;

export type PlanType = (typeof PLANS)[keyof typeof PLANS];

export interface SubscriptionPlanLimits {
  maxBooks: number;
  maxSessionsPerMonth: number | null;
  maxSessionMinutes: number;
  hasSessionHistory: boolean;
}

export interface SubscriptionPlanDefinition {
  slug: Exclude<PlanType, "free"> | null;
  label: string;
  limits: SubscriptionPlanLimits;
}

export const SUBSCRIPTION_PLANS: Record<PlanType, SubscriptionPlanDefinition> =
  {
    [PLANS.FREE]: {
      slug: null,
      label: "Free",
      limits: {
        maxBooks: 1,
        maxSessionsPerMonth: 5,
        maxSessionMinutes: 5,
        hasSessionHistory: false,
      },
    },
    [PLANS.STANDARD]: {
      slug: "standard",
      label: "Standard",
      limits: {
        maxBooks: 10,
        maxSessionsPerMonth: 100,
        maxSessionMinutes: 15,
        hasSessionHistory: true,
      },
    },
    [PLANS.PRO]: {
      slug: "pro",
      label: "Pro",
      limits: {
        maxBooks: 100,
        maxSessionsPerMonth: null,
        maxSessionMinutes: 60,
        hasSessionHistory: true,
      },
    },
  };

export const PLAN_CHECK_ORDER: PlanType[] = [
  PLANS.PRO,
  PLANS.STANDARD,
  PLANS.FREE,
];

export function getBillingPeriodStart(date: Date): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
}

export function getCurrentBillingPeriodKey(): string {
  const currentPeriodStart = getCurrentBillingPeriodStart();
  return currentPeriodStart.toISOString().slice(0, 7);
}

export function getPlanLimits(plan: PlanType): SubscriptionPlanLimits {
  return SUBSCRIPTION_PLANS[plan].limits;
}

export function isPaidPlan(plan: PlanType): boolean {
  return plan !== PLANS.FREE;
}

export function getPlanSlug(plan: PlanType): string | null {
  return SUBSCRIPTION_PLANS[plan].slug;
}
