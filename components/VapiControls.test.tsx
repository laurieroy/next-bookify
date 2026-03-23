import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IBook } from "@/lib/types";

import VapiControls from "./VapiControls";

const routerReplaceMock = vi.hoisted(() => vi.fn());
const useVapiState = vi.hoisted(() => ({
  status: "listening" as
    | "idle"
    | "connecting"
    | "starting"
    | "listening"
    | "thinking"
    | "speaking",
  duration: 61,
  isActive: true,
  limitError: null as string | null,
  messages: [] as Array<{ role: string; content: string }>,
  currentMessage: "",
  currentUserMessage: "",
}));

vi.mock("@/hooks/useVapi", () => ({
  default: () => ({
    clearError: vi.fn(),
    currentMessage: useVapiState.currentMessage,
    currentUserMessage: useVapiState.currentUserMessage,
    duration: useVapiState.duration,
    isActive: useVapiState.isActive,
    limitError: useVapiState.limitError,
    messages: useVapiState.messages,
    status: useVapiState.status,
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => ({
    isLoaded: true,
    plan: "standard",
    isPaid: true,
    limits: {
      maxBooks: 10,
      maxSessionsPerMonth: 100,
      maxSessionMinutes: 15,
      hasSessionHistory: true,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => (
    <span aria-label={alt} {...props} />
  ),
}));

vi.mock("@/components/Transcript", () => ({
  Transcript: () => <div data-testid="transcript" />,
}));

function createBook(): IBook {
  const mockId = { toString: () => "book_1" } as unknown as IBook["_id"];

  return {
    _id: mockId,
    clerkId: "user_123",
    title: "The Testing Book",
    slug: "the-testing-book",
    author: "Author Name",
    persona: "iP95p4xoKVk53GoZ742B",
    fileURL: "",
    fileBlobKey: "",
    coverURL: "/cover.png",
    fileSize: 0,
    totalSegments: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IBook;
}

describe("VapiControls", () => {
  beforeEach(() => {
    routerReplaceMock.mockClear();
    useVapiState.status = "listening";
    useVapiState.duration = 61;
    useVapiState.isActive = true;
    useVapiState.limitError = null;
    useVapiState.messages = [];
    useVapiState.currentMessage = "";
    useVapiState.currentUserMessage = "";
  });

  it("renders the Vapi states and timer in a table-driven flow", () => {
    const { rerender } = render(<VapiControls book={createBook()} />);

    expect(screen.getByText("Voice: Chris")).toBeInTheDocument();
    expect(screen.getByTestId("transcript")).toBeInTheDocument();

    const cases = [
      {
        status: "idle" as const,
        duration: 0,
        label: "Ready",
        dotClass: "vapi-status-dot-ready",
        timer: "0:00/15:00",
      },
      {
        status: "connecting" as const,
        duration: 0,
        label: "Connecting",
        dotClass: "vapi-status-dot-connecting",
        timer: "0:00/15:00",
      },
      {
        status: "starting" as const,
        duration: 0,
        label: "Starting",
        dotClass: "vapi-status-dot-starting",
        timer: "0:00/15:00",
      },
      {
        status: "speaking" as const,
        duration: 1,
        label: "Speaking",
        dotClass: "vapi-status-dot-speaking",
        timer: "0:01/15:00",
      },
      {
        status: "listening" as const,
        duration: 2,
        label: "Listening",
        dotClass: "vapi-status-dot-listening",
        timer: "0:02/15:00",
      },
      {
        status: "thinking" as const,
        duration: 2,
        label: "Thinking",
        dotClass: "vapi-status-dot-thinking",
        timer: "0:02/15:00",
      },
    ];

    for (const testCase of cases) {
      useVapiState.status = testCase.status;
      useVapiState.duration = testCase.duration;
      rerender(<VapiControls book={createBook()} />);

      const statusLabel = screen.getByText(testCase.label);
      const statusIndicator = statusLabel.closest(".vapi-status-indicator");
      const statusDot = statusIndicator?.querySelector(".vapi-status-dot");

      expect(statusLabel).toBeInTheDocument();
      expect(statusDot).toHaveClass(testCase.dotClass);
      expect(screen.getByText(testCase.timer)).toBeInTheDocument();
    }
  });

  it("redirects home when the active session exceeds the plan limit", async () => {
    useVapiState.status = "speaking";
    useVapiState.duration = 15 * 60 + 1;

    render(<VapiControls book={createBook()} />);

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledWith("/");
    });
  });
});
