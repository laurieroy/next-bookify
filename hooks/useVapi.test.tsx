import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { forwardRef, useImperativeHandle } from "react";
import { render, act } from "@testing-library/react";
import type { IBook } from "@/lib/types";

// Hoisted mocks
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "user_123" }),
}));

vi.mock("@/lib/actions/session.actions", () => ({
  startVoiceSessionAction: vi.fn(async () => ({
    success: true,
    sessionId: "sess_1",
  })),
  endVoiceSessionAction: vi.fn(async () => ({ success: true })),
}));

// Controllable mock for @vapi-ai/web
const listeners: Record<string, Array<(p: unknown) => void>> = {};
class MockVapi {
  constructor(apiKey: string) {
    void apiKey;
  }
  on(event: string, handler: (payload: unknown) => void) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }
  off(event: string, handler: (payload: unknown) => void) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter((h) => h !== handler);
  }
  async start() {}
  async stop() {}
  static emit(event: string, payload: unknown) {
    for (const h of listeners[event] || []) h(payload);
  }
}
vi.mock("@vapi-ai/web", () => ({ default: MockVapi }));

function createBook(): IBook {
  const mockId = { toString: () => "book_1" } as unknown as IBook["_id"];
  const book: IBook = {
    _id: mockId,
    clerkId: "user_123",
    title: "Test Book",
    slug: "test-book",
    author: "Author",
    persona: "voiceA",
    fileURL: "",
    fileBlobKey: "",
    coverURL: "",
    fileSize: 0,
    totalSegments: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IBook;
  return book;
}

describe("useVapi", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    for (const k of Object.keys(listeners)) delete listeners[k];
    await vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles user/assistant partial and final transcripts with dedupe", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPI_API_KEY", "test-key");
    const { default: useVapi } = await import("./useVapi");

    type HookApi = ReturnType<typeof useVapi>;
    const HookHarness = forwardRef<HookApi, { book: IBook }>(
      ({ book }, ref) => {
        const api = useVapi(book);
        useImperativeHandle(ref, () => api, [api]);
        return null;
      },
    );
    HookHarness.displayName = "HookHarness";

    const book = createBook();
    const ref = React.createRef<HookApi>();
    render(<HookHarness ref={ref} book={book} />);
    if (!ref.current) throw new Error("ref not set");

    await act(async () => {
      await ref.current!.start();
      // simulate call connection
      MockVapi.emit("call-start", undefined);
    });

    // User partial
    await act(async () => {
      MockVapi.emit("message", {
        type: "transcript",
        role: "user",
        transcriptType: "partial",
        transcript: "Hello there",
      });
    });
    expect(ref.current!.currentUserMessage).toBe("Hello there");

    // User final
    await act(async () => {
      MockVapi.emit("message", {
        type: "transcript",
        role: "user",
        transcriptType: "final",
        transcript: "Hello there",
      });
    });
    expect(ref.current!.currentUserMessage).toBe("");
    expect(ref.current!.status).toBe("thinking");
    expect(ref.current!.messages.at(-1)).toEqual({
      role: "user",
      content: "Hello there",
    });

    // Assistant partial
    await act(async () => {
      MockVapi.emit("message", {
        type: "transcript",
        role: "assistant",
        transcriptType: "partial",
        transcript: "Hi",
      });
    });
    expect(ref.current!.currentMessage).toBe("Hi");

    // Assistant final
    await act(async () => {
      MockVapi.emit("message", {
        type: "transcript",
        role: "assistant",
        transcriptType: "final",
        transcript: "Hi there!",
      });
    });
    expect(ref.current!.currentMessage).toBe("");
    expect(ref.current!.messages.at(-1)).toEqual({
      role: "assistant",
      content: "Hi there!",
    });

    // Duplicate assistant final with same id should be ignored
    await act(async () => {
      MockVapi.emit("message", {
        type: "transcript",
        role: "assistant",
        transcriptType: "final",
        transcript: "Hi there!",
      });
    });
    const lastTwo = ref.current!.messages.slice(-2);
    expect(lastTwo).toEqual([
      { role: "user", content: "Hello there" },
      { role: "assistant", content: "Hi there!" },
    ]);
  });

  it("maps speech/call events and clears on call-end", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPI_API_KEY", "test-key");
    const { default: useVapi } = await import("./useVapi");

    type HookApi = ReturnType<typeof useVapi>;
    const HookHarness = forwardRef<HookApi, { book: IBook }>(
      ({ book }, ref) => {
        const api = useVapi(book);
        useImperativeHandle(ref, () => api, [api]);
        return null;
      },
    );
    HookHarness.displayName = "HookHarness";

    const book = createBook();
    const ref = React.createRef<HookApi>();
    render(<HookHarness ref={ref} book={book} />);
    if (!ref.current) throw new Error("ref not set");

    await act(async () => {
      await ref.current!.start();
      MockVapi.emit("call-start", undefined);
    });

    await act(async () => {
      MockVapi.emit("speech-start", undefined);
    });
    expect(ref.current!.status).toBe("speaking");

    await act(async () => {
      MockVapi.emit("speech-end", undefined);
    });
    expect(ref.current!.status).toBe("listening");

    await act(async () => {
      await ref.current!.stop();
    });
    await act(async () => {
      MockVapi.emit("call-end", undefined);
    });
    expect(ref.current!.currentMessage).toBe("");
    expect(ref.current!.currentUserMessage).toBe("");
    expect(ref.current!.status).toBe("idle");
  });

  it("counts up elapsed time while the call is active", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPI_API_KEY", "test-key");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T20:00:00.000Z"));

    const { default: useVapi } = await import("./useVapi");

    type HookApi = ReturnType<typeof useVapi>;
    const HookHarness = forwardRef<HookApi, { book: IBook }>(
      ({ book }, ref) => {
        const api = useVapi(book);
        useImperativeHandle(ref, () => api, [api]);
        return null;
      },
    );
    HookHarness.displayName = "HookHarness";

    const book = createBook();
    const ref = React.createRef<HookApi>();
    render(<HookHarness ref={ref} book={book} />);
    if (!ref.current) throw new Error("ref not set");

    await act(async () => {
      await ref.current!.start();
      MockVapi.emit("call-start", undefined);
    });

    expect(ref.current!.duration).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });

    expect(ref.current!.duration).toBe(61);

    vi.useRealTimers();
  });

  it.each([
    "send transport changed to disconnected",
    "recv transport changed to disconnected",
    "send transport changed to failed",
    "recv transport changed to failed",
  ])(
    "marks transport failures as an error and stops the timer (%s)",
    async (transportMessage) => {
      vi.stubEnv("NEXT_PUBLIC_VAPI_API_KEY", "test-key");
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-22T20:00:00.000Z"));

      const { default: useVapi } = await import("./useVapi");
      const { endVoiceSessionAction } =
        await import("@/lib/actions/session.actions");

      type HookApi = ReturnType<typeof useVapi>;
      const HookHarness = forwardRef<HookApi, { book: IBook }>(
        ({ book }, ref) => {
          const api = useVapi(book);
          useImperativeHandle(ref, () => api, [api]);
          return null;
        },
      );
      HookHarness.displayName = "HookHarness";

      const book = createBook();
      const ref = React.createRef<HookApi>();
      render(<HookHarness ref={ref} book={book} />);
      if (!ref.current) throw new Error("ref not set");

      await act(async () => {
        await ref.current!.start();
        MockVapi.emit("call-start", undefined);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3_000);
      });

      expect(ref.current!.duration).toBe(3);

      await act(async () => {
        MockVapi.emit("error", new Error(transportMessage));
      });

      expect(ref.current!.status).toBe("error");
      expect(ref.current!.limitError).toBe(
        "Active session failed / disconnected. Click the mic to start again.",
      );
      expect(endVoiceSessionAction).toHaveBeenCalledWith("sess_1", 3);

      const durationAfterFailure = ref.current!.duration;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000);
      });

      expect(ref.current!.duration).toBe(durationAfterFailure);

      await act(async () => {
        MockVapi.emit("call-end", undefined);
      });

      expect(ref.current!.status).toBe("error");
      expect(ref.current!.duration).toBe(durationAfterFailure);
      vi.useRealTimers();
    },
  );
});
