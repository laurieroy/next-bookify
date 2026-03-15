import type { IBook, Messages } from "@/lib/types";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_VOICE } from "@/lib/constants";

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

export const useVapi = (book: IBook) => {
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

  async function start() {}
  async function stop() {}
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
