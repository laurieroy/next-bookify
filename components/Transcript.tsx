"use client";

import { Mic } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import type { Messages } from "@/lib/types";

type TranscriptProps = {
  messages: Messages[];
  currentMessage?: string;
  currentUserMessage?: string;
};

export function Transcript({
  messages,
  currentMessage,
  currentUserMessage,
}: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const allMessages = useMemo(() => {
    const items = messages.map((message, index) => ({
      id: `message-${index}-${message.role}`,
      role: message.role,
      content: message.content,
      streaming: false,
    }));

    if (currentUserMessage?.trim()) {
      items.push({
        id: "current-user-message",
        role: "user",
        content: currentUserMessage,
        streaming: true,
      });
    }

    if (currentMessage?.trim()) {
      items.push({
        id: "current-assistant-message",
        role: "assistant",
        content: currentMessage,
        streaming: true,
      });
    }

    return items;
  }, [currentMessage, currentUserMessage, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  if (allMessages.length === 0) {
    return (
      <div className="transcript-container">
        <div className="transcript-empty">
          <Mic className="mb-4 size-12 text-[#212a3b]" />
          <h2 className="transcript-empty-text">No conversation yet</h2>
          <p className="transcript-empty-hint">
            Start speaking to see your conversation appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-container">
      <div className="transcript-messages">
        {allMessages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`transcript-message ${isUser ? "transcript-message-user" : "transcript-message-assistant"}`}
            >
              <div
                className={`transcript-bubble ${isUser ? "transcript-bubble-user" : "transcript-bubble-assistant"}`}
              >
                <span>{message.content}</span>
                {message.streaming ? (
                  <span
                    aria-hidden="true"
                    className="transcript-cursor"
                  />
                ) : null}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
