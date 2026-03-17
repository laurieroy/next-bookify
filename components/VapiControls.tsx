"use client";

import Image from "next/image";
import { Mic, MicOff } from "lucide-react";

import { Transcript } from "@/components/Transcript";
import useVapi from "@/hooks/useVapi";
import { IBook } from "@/lib/types";

const VapiControls = ({ book }: { book: IBook }) => {
  const {
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
  } = useVapi(book);

  const isPinging =
    isActive && (status === "thinking" || status === "speaking");

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
                aria-label={isActive ? "Stop recording" : "Start recording"}
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
                <span className="vapi-status-dot vapi-status-dot-ready" />
                <span className="vapi-status-text">Ready</span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">
                  Voice: {book.persona ?? "Unknown"}
                </span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">0:00/15:00</span>
              </div>
            </div>
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
