import { describe, expect, it } from "vitest";

import { PLANS } from "@/lib/subscription-constants";
import {
  getPlanFromHas,
  getSubscriptionStatus,
  type ClerkHasAuthorization,
} from "@/lib/subscription";

function matchesPlan(plan: string): ClerkHasAuthorization {
  return (params) => {
    if (!("plan" in params)) {
      return false;
    }

    return params.plan === plan;
  };
}

function matchesAnyPlan(plans: string[]): ClerkHasAuthorization {
  return (params) => {
    if (!("plan" in params)) {
      return false;
    }

    return plans.includes(params.plan);
  };
}

function neverMatchesPlan(): ClerkHasAuthorization {
  return () => false;
}

describe("getPlanFromHas", () => {
  it("returns the free plan when has() is null", () => {
    expect(getPlanFromHas(null)).toBe(PLANS.FREE);
  });

  it("returns the free plan when has() never matches a known plan", () => {
    expect(getPlanFromHas(neverMatchesPlan())).toBe(PLANS.FREE);
  });

  it("returns the highest matching paid plan", () => {
    expect(getPlanFromHas(matchesAnyPlan(["standard", "pro"]))).toBe(PLANS.PRO);
  });
});

describe("getSubscriptionStatus", () => {
  it("returns the free plan when no has() function is available", () => {
    const result = getSubscriptionStatus();

    expect(result).toEqual({
      plan: PLANS.FREE,
      limits: {
        maxBooks: 1,
        maxSessionsPerMonth: 5,
        maxSessionMinutes: 5,
        hasSessionHistory: false,
      },
      isPaid: false,
    });
  });

  it("returns the standard plan when has() matches the standard slug", () => {
    const result = getSubscriptionStatus(matchesPlan("standard"));

    expect(result).toEqual({
      plan: PLANS.STANDARD,
      limits: {
        maxBooks: 10,
        maxSessionsPerMonth: 100,
        maxSessionMinutes: 15,
        hasSessionHistory: true,
      },
      isPaid: true,
    });
  });

  it("returns the pro plan when has() matches the pro slug", () => {
    const result = getSubscriptionStatus(matchesPlan("pro"));

    expect(result).toEqual({
      plan: PLANS.PRO,
      limits: {
        maxBooks: 100,
        maxSessionsPerMonth: null,
        maxSessionMinutes: 60,
        hasSessionHistory: true,
      },
      isPaid: true,
    });
  });

  it("prefers the highest plan when multiple plan checks return true", () => {
    const result = getSubscriptionStatus(matchesAnyPlan(["standard", "pro"]));

    expect(result.plan).toBe(PLANS.PRO);
    expect(result.limits.maxBooks).toBe(100);
    expect(result.isPaid).toBe(true);
  });

  it("returns the free plan when has() does not match a known paid plan", () => {
    const result = getSubscriptionStatus(matchesPlan("enterprise"));

    expect(result.plan).toBe(PLANS.FREE);
    expect(result.isPaid).toBe(false);
  });
});
