import {
  getPlanLimits,
  getPlanSlug,
  PLAN_CHECK_ORDER,
  PLANS,
  type PlanType,
  type SubscriptionPlanLimits,
} from "@/lib/subscription-constants";

type AuthorizationCheckParams =
  | { plan: string }
  | { feature: string }
  | { permission: string }
  | { role: string };

export type ClerkHasAuthorization = (
  params: AuthorizationCheckParams,
) => boolean;

export interface SubscriptionStatus {
  plan: PlanType;
  limits: SubscriptionPlanLimits;
  isPaid: boolean;
}

export function getPlanFromHas(has?: ClerkHasAuthorization | null): PlanType {
  if (!has) {
    return PLANS.FREE;
  }

  for (const plan of PLAN_CHECK_ORDER) {
    const slug = getPlanSlug(plan);

    if (!slug) {
      continue;
    }

    if (has({ plan: slug })) {
      return plan;
    }
  }

  return PLANS.FREE;
}

export function getSubscriptionStatus(
  has?: ClerkHasAuthorization | null,
): SubscriptionStatus {
  const plan = getPlanFromHas(has);

  return {
    plan,
    limits: getPlanLimits(plan),
    isPaid: plan !== PLANS.FREE,
  };
}
