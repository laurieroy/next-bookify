import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLANS } from "@/lib/subscription-constants";
import {
  getCurrentPlan,
  getCurrentSubscriptionStatus,
} from "@/lib/subscription.server";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

describe("getCurrentSubscriptionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the free plan when Clerk auth has no matching paid plan", async () => {
    authMock.mockResolvedValue({
      has: () => false,
    });

    await expect(getCurrentSubscriptionStatus()).resolves.toEqual({
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

  it("returns the pro plan when Clerk auth matches the pro plan", async () => {
    authMock.mockResolvedValue({
      has: (params: { plan: string }) => params.plan === "pro",
    });

    await expect(getCurrentSubscriptionStatus()).resolves.toEqual({
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
});

describe("getCurrentPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the resolved current plan", async () => {
    authMock.mockResolvedValue({
      has: (params: { plan: string }) => params.plan === "standard",
    });

    await expect(getCurrentPlan()).resolves.toBe(PLANS.STANDARD);
  });
});
