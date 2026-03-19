"use server";

import { auth } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/database/mongoose";
import { StartSessionResult } from "@/lib/types";
import VoiceSession from "@/database/models/voice-session.model";
import { getCurrentBillingPeriodStart } from "@/lib/subscription-constants";
import { getCurrentSubscriptionStatus } from "@/lib/subscription.server";

export async function startVoiceSessionAction(
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> {
  try {
    await connectToDatabase();

    const { userId } = await auth();

    if (!userId || userId !== clerkId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const subscription = await getCurrentSubscriptionStatus();
    const billingPeriodStart = getCurrentBillingPeriodStart();
    const sessionLimit = subscription.limits.maxSessionsPerMonth;

    if (sessionLimit !== null) {
      const currentSessionCount = await VoiceSession.countDocuments({
        clerkId: userId,
        billingPeriodStart,
      });

      if (currentSessionCount >= sessionLimit) {
        return {
          success: false,
          error: `You have reached your ${subscription.plan} plan limit of ${sessionLimit} voice session${sessionLimit === 1 ? "" : "s"} for this month. Upgrade your subscription to continue.`,
          maxDurationMinutes: subscription.limits.maxSessionMinutes,
          isBillingError: true,
        };
      }
    }

    const session = await VoiceSession.create({
      clerkId: userId,
      bookId,

      startedAt: new Date(),
      billingPeriodStart,
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: subscription.limits.maxSessionMinutes,
    };
  } catch (error) {
    console.error("Error starting voice session:", error);
    return {
      success: false,
      error: "Failed to start a voice session. Please try again later.",
    };
  }
}

export async function endVoiceSessionAction(
  sessionId: string,
  durationSeconds: number,
) {
  try {
    await connectToDatabase();

    const result = await VoiceSession.findByIdAndUpdate(
      sessionId,
      {
        endedAt: new Date(),
        durationSeconds: Math.max(0, Math.floor(durationSeconds || 0)),
      },
      // { new: true, runValidators: true },
    );

    if (!result) {
      return {
        success: false,
        error: "Session not found",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error ending voice session:", error);
    return {
      success: false,
      error: "Failed to end voice session. Please try again.",
    };
  }
}
