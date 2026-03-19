import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  SUBSCRIPTION_PLANS,
  type PlanType,
} from "@/lib/subscription-constants";
import { getCurrentSubscriptionStatus } from "@/lib/subscription.server";

const planOrder: PlanType[] = ["free", "standard", "pro"];

export default async function SubscriptionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const subscription = await getCurrentSubscriptionStatus();

  return (
    <main className="clerk-subscriptions">
      <section className="subscription-hero-card w-full">
        <div className="subscription-hero-copy">
          <p className="subscription-eyebrow">Billing</p>
          <h1 className="page-title-xl">
            Choose the Bookify plan that fits your reading workflow
          </h1>
          <p className="subtitle max-w-3xl">
            Upgrade with Clerk Billing to unlock more books, longer voice
            sessions, and higher monthly usage limits without leaving your
            account.
          </p>
        </div>

        <div className="subscription-current-plan">
          <span className="subscription-current-plan-label">Current plan</span>
          <span className="subscription-current-plan-value">
            {SUBSCRIPTION_PLANS[subscription.plan].label}
          </span>
        </div>
      </section>

      <section className="subscription-plan-grid w-full">
        {planOrder.map((plan) => {
          const definition = SUBSCRIPTION_PLANS[plan];
          const sessionLimit =
            definition.limits.maxSessionsPerMonth === null
              ? "Unlimited sessions/month"
              : `${definition.limits.maxSessionsPerMonth} sessions/month`;

          return (
            <article
              key={plan}
              className={`subscription-plan-card ${subscription.plan === plan ? "subscription-plan-card-active" : ""}`}
            >
              <div className="subscription-plan-card-header">
                <h2 className="section-title">{definition.label}</h2>
                <p className="subscription-plan-card-description">
                  {definition.limits.maxBooks} book
                  {definition.limits.maxBooks === 1 ? "" : "s"}
                </p>
              </div>

              <dl className="subscription-plan-card-metrics">
                <div>
                  <dt>Books</dt>
                  <dd>{definition.limits.maxBooks} max</dd>
                </div>
                <div>
                  <dt>Voice sessions</dt>
                  <dd>{sessionLimit}</dd>
                </div>
                <div>
                  <dt>Session length</dt>
                  <dd>{definition.limits.maxSessionMinutes} minutes</dd>
                </div>
                <div>
                  <dt>Session history</dt>
                  <dd>
                    {definition.limits.hasSessionHistory
                      ? "Included"
                      : "Not included"}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>

      <section className="clerk-pricing-container w-full">
        <PricingTable
          appearance={{
            variables: {
              colorPrimary: "#212a3b",
              colorText: "#212a3b",
              colorBackground: "#f8f4e9",
              colorNeutral: "#f3e4c7",
              borderRadius: "1rem",
              fontFamily: "var(--font-mona-sans)",
            },
          }}
        />
      </section>
    </main>
  );
}
