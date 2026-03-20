import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SubscriptionPlanAction } from "@/components/SubscriptionPlanAction";
import {
  PLANS,
  SUBSCRIPTION_PLANS,
  type PlanType,
} from "@/lib/subscription-constants";
import { getCurrentSubscriptionStatus } from "@/lib/subscription.server";

const planOrder: PlanType[] = [PLANS.FREE, PLANS.STANDARD, PLANS.PRO];

function getActionLabel(currentPlan: PlanType, targetPlan: PlanType) {
  const targetLabel = SUBSCRIPTION_PLANS[targetPlan].label;

  if (targetPlan === PLANS.FREE) {
    return `Switch to ${targetLabel}`;
  }

  return planOrder.indexOf(targetPlan) > planOrder.indexOf(currentPlan)
    ? `Upgrade to ${targetLabel}`
    : `Switch to ${targetLabel}`;
}

function getPlanFeatureRows(plan: PlanType) {
  const definition = SUBSCRIPTION_PLANS[plan];

  return [
    {
      label: "Books",
      value: `${definition.limits.maxBooks} max`,
      muted: false,
    },
    {
      label: "Voice sessions",
      value:
        definition.limits.maxSessionsPerMonth === null
          ? "Unlimited / month"
          : `${definition.limits.maxSessionsPerMonth} / month`,
      muted: false,
    },
    {
      label: "Session history",
      value: definition.limits.hasSessionHistory ? "Included" : "—",
      muted: !definition.limits.hasSessionHistory,
    },
    {
      label: "Priority support",
      value: definition.hasPrioritySupport ? "Included" : "—",
      muted: !definition.hasPrioritySupport,
    },
  ];
}

export default async function SubscriptionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const subscription = await getCurrentSubscriptionStatus();

  return (
    <main className="bg-background pt-8 md:pt-8">
      <div className="mx-auto max-w-6xl px-4 py-8 font-sans md:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Billing
            </p>
            <h1 className="text-4xl font-bold font-serif text-foreground md:text-5xl">
              Choose Your Plan
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Upgrade to unlock more books, longer sessions, and advanced
              features.
            </p>
          </div>
        </div>

        <section className="mt-14">
          <div className="mb-8 flex flex-col gap-3 text-center md:text-left">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Feature comparison
            </p>
            <h2 className="text-2xl font-bold font-serif text-foreground md:text-3xl">
              Compare the plan attributes at a glance
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {planOrder.map((plan) => {
              const definition = SUBSCRIPTION_PLANS[plan];
              const featureRows = getPlanFeatureRows(plan);
              const isHighlighted = plan === PLANS.STANDARD;
              const isCurrentPlan = subscription.plan === plan;

              return (
                <article
                  key={plan}
                  className={`relative rounded-2xl border bg-card p-8 shadow-sm transition-transform hover:scale-[1.01] ${
                    isHighlighted
                      ? "z-10 border-primary shadow-xl md:scale-[1.03]"
                      : "border-border"
                  }`}
                >
                  {isHighlighted ? (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--color-brand) bg-accent px-4 py-1 text-xs font-bold tracking-wide text-accent-foreground">
                      MOST POPULAR
                    </div>
                  ) : null}

                  <h3 className="text-2xl font-bold font-serif text-card-foreground">
                    {definition.label}
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    {plan === PLANS.FREE
                      ? "For getting started"
                      : plan === PLANS.STANDARD
                        ? "Perfect for readers"
                        : "Power user tools"}
                  </p>

                  <dl className="mb-8 space-y-4 text-sm">
                    {featureRows.map((feature) => (
                      <div
                        key={feature.label}
                        className={`flex items-center justify-between gap-4 ${
                          feature.muted
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        <dt>{feature.label}</dt>
                        <dd className="font-bold">{feature.value}</dd>
                      </div>
                    ))}
                  </dl>

                  {isCurrentPlan ? (
                    <button
                      className="w-full rounded-xl border-2 border-border bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground cursor-not-allowed opacity-80"
                      disabled
                      type="button"
                    >
                      Current plan
                    </button>
                  ) : (
                    <SubscriptionPlanAction
                      actionLabel={getActionLabel(subscription.plan, plan)}
                      className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                        isHighlighted
                          ? "border-primary bg-primary text-primary-foreground hover:border-(--color-brand) hover:bg-(--color-brand) hover:text-white"
                          : "border-secondary bg-secondary text-secondary-foreground hover:border-(--color-brand) hover:bg-(--color-brand) hover:text-white"
                      }`}
                      currentPlan={subscription.plan}
                      targetPlan={plan}
                    />
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
