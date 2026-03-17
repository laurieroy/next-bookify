import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

import type { IBook, Messages } from "@/lib/types";
import { ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/constants";
import { startVoiceSessionAction } from "@/lib/actions/session.actions";
import { getVoice } from "@/lib/utils";

export type CallStatus =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking";

const useLatestRef = <T>(value: T) => {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;
let vapi: InstanceType<typeof Vapi>;

function getVapi() {
  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error(
        "VAPI_API_KEY is not defined. Please set in the .env file.",
      );
    }

    vapi = new Vapi(VAPI_API_KEY);
  }

  return vapi;
}

const useVapi = (book: IBook) => {
  const { userId } = useAuth();

  // TODO: Implement limits
  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [limitError, setLimitError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>("");
  const isStoppingRef = useRef<boolean>(false);

  const bookRef = useLatestRef(book);
  const durationRef = useLatestRef(duration);
  const voice = book.persona || DEFAULT_VOICE;

  const isActive =
    status === "starting" ||
    status === "listening" ||
    status === "thinking" ||
    status === "speaking";

  // LIMITS TODO
  // const maxDurationRef = useLatestRef(resourceLimits.maxSessionMinutes * 60);
  // const maxDurationInSeconds
  // const remainingSeconds
  // const showTimeWarning

  async function start() {
    if (!userId) {
      return setLimitError("Please login to start a session");
    }

    setLimitError(null);
    setStatus("connecting");

    try {
      const result = await startVoiceSessionAction(book._id.toString(), userId);
      if (!result.success) {
        setLimitError(
          result.error || "Session limit reached. Please upgrade your plan.",
        );
        setStatus("idle");
        return;
      }

      console.log("Starting Vapi call for book:", book.title);

      sessionIdRef.current = result.sessionId || "";

      const firstMessage = `Hey, good to meet you! Quick question before we dive in: Have you actually read ${book.title} yet? Or are we starting from page 1?`;

      await getVapi().start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          bookTitle: book.title,
          author: book.author,
          bookId: book._id.toString(),
        },
        // voice: {
        //   provider: "11labs" as const,
        //   model: "eleven_turbo_v2_5" as const,
        //   voiceId: getVoice(voice).id,
        //   stability: VOICE_SETTINGS.stability,
        //   similarityBoost: VOICE_SETTINGS.similarityBoost,
        //   style: VOICE_SETTINGS.style,
        //   useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
        // },
      });
      // setCurrentMessage(firstMessage);
    } catch (error) {
      console.error("Error starting session:", error);
      setStatus("idle");
      setLimitError("An error occurred while starting the call");
    }
  }
  async function stop() {
    isStoppingRef.current = true;
    try {
      await getVapi().stop();
    } catch (error) {
      console.error("Error stopping session:", error);
    } finally {
      isStoppingRef.current = false;
    }
  }
  async function clearErrors() {}

  return {
    clearErrors,
    currentMessage,
    currentUserMessage,
    duration,
    isActive,
    limitError,
    messages,
    status,
    start,
    stop,
    // maxDurationInSeconds,
    // remainingSeconds,
    // showTimeWarning,
  };
};

export default useVapi;
