import { auth } from "@clerk/nextjs/server";

import {
  getSubscriptionStatus,
  type SubscriptionStatus,
} from "@/lib/subscription";

export async function getCurrentSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { has } = await auth();

  return getSubscriptionStatus(has);
}

export async function getCurrentPlan() {
  const subscription = await getCurrentSubscriptionStatus();

  return subscription.plan;
}
