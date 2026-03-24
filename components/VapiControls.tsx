"use client";

import Image from "next/image";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Transcript } from "@/components/Transcript";
import useVapi from "@/hooks/useVapi";
import { useSubscription } from "@/hooks/useSubscription";
import { formatDuration, getVoice } from "@/lib/utils";
import { IBook } from "@/lib/types";

const VapiControls = ({ book }: { book: IBook }) => {
  const router = useRouter();
  const { limits } = useSubscription();
  const {
    clearError,
    currentMessage,
    currentUserMessage,
    duration,
    isActive,
    limitError,
    messages,
    status,
    start,
    stop,
  } = useVapi(book);

  const hasRedirectedRef = useRef(false);
  const maxDurationSeconds = limits.maxSessionMinutes * 60;

  const isPinging =
    isActive && (status === "thinking" || status === "speaking");

  const statusLabel = (() => {
    switch (status) {
      case "connecting":
        return "Connecting";
      case "starting":
        return "Starting";
      case "listening":
        return "Listening";
      case "thinking":
        return "Thinking";
      case "speaking":
        return "Speaking";
      case "error":
        return "Disconnected";
      default:
        return "Ready";
    }
  })();

  const statusDotClass = (() => {
    switch (status) {
      case "connecting":
        return "vapi-status-dot-connecting";
      case "starting":
        return "vapi-status-dot-starting";
      case "listening":
        return "vapi-status-dot-listening";
      case "thinking":
        return "vapi-status-dot-thinking";
      case "speaking":
        return "vapi-status-dot-speaking";
      case "error":
        return "vapi-status-dot-error";
      default:
        return "vapi-status-dot-ready";
    }
  })();

  const voiceName = getVoice(book.persona).name;

  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }

    if (!isActive || status === "idle" || duration < maxDurationSeconds) {
      return;
    }

    hasRedirectedRef.current = true;
    stop();
    router.replace("/");
  }, [duration, isActive, maxDurationSeconds, router, status, stop]);

  return (
    <>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="vapi-header-card flex-col items-start sm:flex-row">
          <div className="vapi-cover-wrapper">
            <Image
              src={book.coverURL || ""}
              alt={book.title}
              width={120}
              height={180}
              className="vapi-cover-image h-auto w-[120px]"
            />

            <div className="vapi-mic-wrapper">
              <button
                type="button"
                onClick={isActive ? stop : start}
                className="vapi-mic-btn"
                title={
                  isActive ? "Stop voice assistant" : "Start voice assistant"
                }
                aria-label={
                  isActive ? "Stop voice assistant" : "Start voice assistant"
                }
                disabled={status === "connecting" || status === "starting"}
              >
                {isActive ? (
                  <Mic
                    className={`size-6 text-[#212a3b] ${isPinging ? "animate-ping" : ""}`}
                  />
                ) : (
                  <MicOff className="size-6 text-[#212a3b]" />
                )}
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4 self-center sm:self-auto">
            <div className="space-y-1.5">
              <h1 className="font-serif text-2xl font-bold text-[#212a3b] sm:text-3xl">
                {book.title}
              </h1>
              <p className="text-base text-[#5c4a3a] sm:text-lg">
                by {book.author}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="vapi-status-indicator">
                <span className={`vapi-status-dot ${statusDotClass}`} />
                <span className="vapi-status-text">{statusLabel}</span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">Voice: {voiceName}</span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">
                  {formatDuration(duration)}/
                  {formatDuration(maxDurationSeconds)}
                </span>
              </div>
            </div>

            {limitError ? (
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{limitError}</p>
                  <button
                    type="button"
                    onClick={clearError}
                    className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                    aria-label="Dismiss session message"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="vapi-transcript-wrapper">
          <Transcript
            messages={messages}
            currentMessage={currentMessage}
            currentUserMessage={currentUserMessage}
          />
        </div>
      </div>
    </>
  );
};

export default VapiControls;
