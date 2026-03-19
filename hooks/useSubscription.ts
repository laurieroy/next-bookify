"use client";

import { useAuth } from "@clerk/nextjs";

import { getSubscriptionStatus } from "@/lib/subscription";

export function useSubscription() {
  const { has, isLoaded } = useAuth();

  return {
    isLoaded,
    ...getSubscriptionStatus(has),
  };
}
