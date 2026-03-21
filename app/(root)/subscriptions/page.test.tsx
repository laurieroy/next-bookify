import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SubscriptionsPage from "./page";

const { authMock, getCurrentSubscriptionStatusMock, redirectMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    getCurrentSubscriptionStatusMock: vi.fn(),
    redirectMock: vi.fn(),
  }),
);

const subscriptionPlanActionMock = vi.fn(
  ({ actionLabel }: { actionLabel: string }) => (
    <button data-testid={`plan-action-${actionLabel}`}>{actionLabel}</button>
  ),
);

vi.mock("@/components/SubscriptionPlanAction", () => ({
  SubscriptionPlanAction: (props: unknown) =>
    subscriptionPlanActionMock(props as { actionLabel: string }),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/subscription.server", () => ({
  getCurrentSubscriptionStatus: getCurrentSubscriptionStatusMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("SubscriptionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authMock.mockResolvedValue({ userId: "user_123" });
    getCurrentSubscriptionStatusMock.mockResolvedValue({
      plan: "pro",
      limits: {
        maxBooks: 100,
        maxSessionsPerMonth: null,
        maxSessionMinutes: 60,
        hasSessionHistory: true,
      },
      isPaid: true,
    });
  });

  it("renders the subscription page for an authenticated user", async () => {
    render(await SubscriptionsPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Choose Your Plan",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Upgrade to unlock more books, longer sessions, and advanced features.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Compare the plan attributes at a glance/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(
      screen.getByRole("heading", { level: 3, name: "Free" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Standard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Pro" }),
    ).toBeInTheDocument();
  });

  it("renders switch actions in the comparison cards", async () => {
    render(await SubscriptionsPage());

    expect(screen.getByText("Switch to Free")).toBeInTheDocument();
    expect(screen.getByText("Switch to Standard")).toBeInTheDocument();
    expect(screen.getByText("Current plan")).toBeInTheDocument();
    expect(
      screen.getByTestId("plan-action-Switch to Free"),
    ).toBeInTheDocument();
  });

  it("renders the pricing page for unauthenticated users", async () => {
    authMock.mockResolvedValue({ userId: null });

    render(await SubscriptionsPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Choose Your Plan",
      }),
    ).toBeInTheDocument();
    expect(getCurrentSubscriptionStatusMock).not.toHaveBeenCalled();
  });
});
