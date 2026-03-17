"use server";

import { connectToDatabase } from "@/database/mongoose";
import { StartSessionResult } from "@/lib/types";
import VoiceSession from "@/database/models/voice-session.model";
import { getCurrentBillingPeriodStart } from "@/lib/subscription-constants";

export async function startVoiceSessionAction(
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> {
  try {
    await connectToDatabase();

    // TODO: Check Limits/Plan

    const session = await VoiceSession.create({
      clerkId,
      bookId,

      startedAt: new Date(),
      billingPeriodStart: getCurrentBillingPeriodStart(),
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      // maxDurationMinutes: check.maxDurationMinutes,
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
