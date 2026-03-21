"use client";

import {
  CheckoutButton,
  SubscriptionDetailsButton,
  usePlans,
} from "@clerk/nextjs/experimental";
import { SignInButton, Show } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanType } from "@/lib/subscription-constants";

interface SubscriptionPlanActionProps {
  actionLabel: string;
  className?: string;
  currentPlan: PlanType;
  targetPlan: PlanType;
}

type ClerkPlanLike = {
  id?: string;
  name?: string | null;
  slug?: string | null;
};

function matchesTargetPlan(plan: ClerkPlanLike, targetPlan: PlanType) {
  return plan.slug === targetPlan || plan.name?.toLowerCase() === targetPlan;
}

export function SubscriptionPlanAction({
  actionLabel,
  className,
  currentPlan,
  targetPlan,
}: SubscriptionPlanActionProps) {
  const { data, isLoading } = usePlans({
    for: "user",
    pageSize: 10,
  });

  const targetClerkPlan = data?.find((plan) =>
    matchesTargetPlan(plan, targetPlan),
  );
  const targetPlanId = targetClerkPlan?.id;
  const isDowngradeToFree = targetPlan === "free" && currentPlan !== "free";
  const isPaidTargetPlan = targetPlan !== "free";

  if (isDowngradeToFree) {
    return (
      <>
        <Show when="signed-in">
          <SubscriptionDetailsButton>
            <Button className={className} size="lg" type="button">
              {actionLabel}
            </Button>
          </SubscriptionDetailsButton>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button className={className} size="lg" type="button">
              {actionLabel}
            </Button>
          </SignInButton>
        </Show>
      </>
    );
  }

  if (isPaidTargetPlan && targetPlanId) {
    return (
      <>
        <Show when="signed-in">
          <CheckoutButton planId={targetPlanId}>
            <Button className={className} size="lg" type="button">
              {actionLabel}
            </Button>
          </CheckoutButton>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button className={className} size="lg" type="button">
              {actionLabel}
            </Button>
          </SignInButton>
        </Show>
      </>
    );
  }

  return (
    <Button
      className={cn(className)}
      disabled={isLoading || isPaidTargetPlan}
      size="lg"
      type="button"
    >
      {isLoading ? "Loading..." : actionLabel}
    </Button>
  );
}
