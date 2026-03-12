// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";

import { createBookAction, saveBookSegmentsAction } from "./book.actions";
import * as db from "@/database/mongoose";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

// be sure to enable server actions in vitest config

vi.mock("@clerk/nextjs", () => ({
  auth: vi.fn(),
}));

vi.mock("@/database/mongoose", () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock("@/database/models/book.model", () => ({
  default: {
    countDocuments: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock("@/database/models/book-segment.model", () => ({
  default: {
    insertMany: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

describe("createBook Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip("should prevent a Free user from uploading more than 1 book", async () => {
    const { auth } = await import("@clerk/nextjs");

    // Simulate a logged-in user on Free plan
    (auth as any).mockReturnValue({ userId: "user_123" });

    // Simulate they already have 1 book in DB
    (Book.countDocuments as any).mockResolvedValue(1);

    const result = await createBookAction({ title: "New Book" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("limit reached");
    expect(Book.create).not.toHaveBeenCalled();
  });

  it("should fail if no user is authenticated", async () => {
    const { auth } = await import("@clerk/nextjs");
    (auth as any).mockReturnValue({ userId: null });

    const result = await createBookAction({ title: "Ghost Book" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });
});

describe("saveBookSegmentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves book segments", async () => {
    const { auth } = await import("@clerk/nextjs");
    (auth as any).mockReturnValue({ userId: "user_123" });

    const result = await saveBookSegmentsAction({
      bookId: "book_123",
      segments: [
        {
          text: "Hello world",
          segmentIndex: 0,
          wordCount: 2,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(BookSegment.insertMany).toHaveBeenCalled();
  });

  it("updates totalSegments to 0 when no segments are provided", async () => {
    (BookSegment.insertMany as any).mockResolvedValue([]);
    (Book.findByIdAndUpdate as any).mockResolvedValue({});

    const result = await saveBookSegmentsAction({
      bookId: "book_123",
      clerkId: "user_123",
      segments: [],
    });

    expect(BookSegment.insertMany).toHaveBeenCalledWith([]);
    expect(Book.findByIdAndUpdate).toHaveBeenCalledWith("book_123", {
      totalSegments: 0,
    });
    expect(result).toEqual({
      success: true,
      data: { segmentsCreated: 0 },
    });
  });

  it("cleans up inserted data if saving segments fails", async () => {
    const error = new Error("insert failed");
    (BookSegment.insertMany as any).mockRejectedValue(error);
    (BookSegment.deleteMany as any).mockResolvedValue({});
    (Book.findByIdAndDelete as any).mockResolvedValue({});

    const result = await saveBookSegmentsAction({
      bookId: "book_123",
      clerkId: "user_123",
      segments: [{ text: "hello world", segmentIndex: 0, wordCount: 2 }],
    });

    expect(result).toEqual({
      success: false,
      error: "insert failed",
    });

    expect(BookSegment.deleteMany).toHaveBeenCalledWith({
      bookId: "book_123",
    });
    expect(Book.findByIdAndDelete).toHaveBeenCalledWith("book_123");
  });
});
