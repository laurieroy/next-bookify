// @vitest-environment node

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

import {
  createBookAction,
  getBookBySlugAction,
  saveBookSegmentsAction,
} from "./book.actions";
import * as db from "@/database/mongoose";
import { getCurrentSubscriptionStatus } from "@/lib/subscription.server";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/subscription.server", () => ({
  getCurrentSubscriptionStatus: vi.fn(),
}));

vi.mock("@/database/mongoose", () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock("@/database/models/book.model", () => ({
  default: {
    countDocuments: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
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

const bookFixture = () => ({
  _id: "book_123",
  clerkId: "user_123",
  title: "Ghost Book",
  slug: "ghost-book",
  author: "Someone",
  persona: "alloy",
  fileURL: "https://example.com/book.pdf",
  fileBlobKey: "book.pdf",
  coverURL: "https://example.com/cover.png",
  fileSize: 1234,
  totalSegments: 0,
});

const mockBookFindOne = Book.findOne as Mock;
const mockBookCountDocuments = Book.countDocuments as Mock;
const mockBookCreate = Book.create as Mock;
const mockBookFindById = Book.findById as Mock;
const mockBookFindByIdAndUpdate = Book.findByIdAndUpdate as Mock;
const mockBookFindByIdAndDelete = Book.findByIdAndDelete as Mock;
const mockBookSegmentInsertMany = BookSegment.insertMany as Mock;
const mockBookSegmentDeleteMany = BookSegment.deleteMany as Mock;
const mockGetCurrentSubscriptionStatus = getCurrentSubscriptionStatus as Mock;

describe("createBook Server Action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the existing book when the slug already exists before create", async () => {
    const existingBook = bookFixture();

    mockBookFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(existingBook),
    });

    const result = await createBookAction({
      data: {
        title: "Ghost Book",
        author: "Someone",
        persona: "alloy",
        fileURL: "https://example.com/book.pdf",
        fileBlobKey: "book.pdf",
        coverURL: "https://example.com/cover.png",
        fileSize: 1234,
      },
    });

    expect(db.connectToDatabase).toHaveBeenCalled();
    expect(Book.findOne).toHaveBeenCalledWith({ slug: "ghost-book" });
    expect(Book.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: existingBook,
      status: "existing",
    });
  });

  it("returns the existing book if create loses a race to the unique slug constraint", async () => {
    const existingBook = bookFixture();

    mockBookFindOne
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      })
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(existingBook),
      });

    const duplicateKeyError = Object.assign(
      new Error("E11000 duplicate key error"),
      {
        code: 11000,
      },
    );

    mockBookCreate.mockRejectedValue(duplicateKeyError);
    mockBookCountDocuments.mockResolvedValue(0);
    mockGetCurrentSubscriptionStatus.mockResolvedValue({
      plan: "free",
      limits: {
        maxBooks: 1,
        maxSessionsPerMonth: 5,
        maxSessionMinutes: 5,
        hasSessionHistory: false,
      },
      isPaid: false,
    });

    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: "user_123" });

    const result = await createBookAction({
      data: {
        title: "Ghost Book",
        author: "Someone",
        persona: "alloy",
        fileURL: "https://example.com/book.pdf",
        fileBlobKey: "book.pdf",
        coverURL: "https://example.com/cover.png",
        fileSize: 1234,
      },
    });

    expect(db.connectToDatabase).toHaveBeenCalledTimes(2);
    expect(Book.findOne).toHaveBeenCalledTimes(2);
    expect(Book.findOne).toHaveBeenCalledWith({ slug: "ghost-book" });
    expect(Book.create).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: existingBook,
      status: "existing",
    });
  });

  it("returns the free-plan limit error when the user already owns the maximum number of books", async () => {
    mockBookFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });
    mockBookCountDocuments.mockResolvedValue(1);
    mockGetCurrentSubscriptionStatus.mockResolvedValue({
      plan: "free",
      limits: {
        maxBooks: 1,
        maxSessionsPerMonth: 5,
        maxSessionMinutes: 5,
        hasSessionHistory: false,
      },
      isPaid: false,
    });

    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: "user_123" });

    const result = await createBookAction({
      data: {
        title: "New Book",
        author: "Someone",
        persona: "alloy",
        fileURL: "https://example.com/book.pdf",
        fileBlobKey: "book.pdf",
        coverURL: "https://example.com/cover.png",
        fileSize: 1234,
      },
    });

    expect(db.connectToDatabase).toHaveBeenCalled();
    expect(Book.findOne).toHaveBeenCalledWith({ slug: "new-book" });
    expect(Book.countDocuments).toHaveBeenCalledWith({ clerkId: "user_123" });
    expect(getCurrentSubscriptionStatus).toHaveBeenCalled();
    expect(Book.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error:
        "Your free plan allows up to 1 book. Upgrade your subscription to upload more.",
      code: "BOOK_LIMIT_REACHED",
    });
  });

  it("creates a book when the user is within the standard plan limit", async () => {
    const createdBook = {
      ...bookFixture(),
      title: "Standard Plan Book",
      slug: "standard-plan-book",
    };

    mockBookFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });
    mockBookCountDocuments.mockResolvedValue(9);
    mockGetCurrentSubscriptionStatus.mockResolvedValue({
      plan: "standard",
      limits: {
        maxBooks: 10,
        maxSessionsPerMonth: 100,
        maxSessionMinutes: 15,
        hasSessionHistory: true,
      },
      isPaid: true,
    });
    mockBookCreate.mockResolvedValue(createdBook);

    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: "user_123" });

    const result = await createBookAction({
      data: {
        title: "Standard Plan Book",
        author: "Someone",
        persona: "alloy",
        fileURL: "https://example.com/book.pdf",
        fileBlobKey: "book.pdf",
        coverURL: "https://example.com/cover.png",
        fileSize: 1234,
      },
    });

    expect(getCurrentSubscriptionStatus).toHaveBeenCalled();
    expect(Book.countDocuments).toHaveBeenCalledWith({ clerkId: "user_123" });
    expect(Book.create).toHaveBeenCalledWith({
      title: "Standard Plan Book",
      author: "Someone",
      persona: "alloy",
      fileURL: "https://example.com/book.pdf",
      fileBlobKey: "book.pdf",
      coverURL: "https://example.com/cover.png",
      fileSize: 1234,
      clerkId: "user_123",
      slug: "standard-plan-book",
      totalSegments: 0,
    });
    expect(result).toEqual({
      success: true,
      status: "created",
      data: createdBook,
    });
  });

  it("returns the standard-plan limit error when the user already owns the maximum number of books", async () => {
    mockBookFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });
    mockBookCountDocuments.mockResolvedValue(10);
    mockGetCurrentSubscriptionStatus.mockResolvedValue({
      plan: "standard",
      limits: {
        maxBooks: 10,
        maxSessionsPerMonth: 100,
        maxSessionMinutes: 15,
        hasSessionHistory: true,
      },
      isPaid: true,
    });

    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: "user_123" });

    const result = await createBookAction({
      data: {
        title: "Another Standard Book",
        author: "Someone",
        persona: "alloy",
        fileURL: "https://example.com/book.pdf",
        fileBlobKey: "book.pdf",
        coverURL: "https://example.com/cover.png",
        fileSize: 1234,
      },
    });

    expect(Book.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error:
        "Your standard plan allows up to 10 books. Upgrade your subscription to upload more.",
      code: "BOOK_LIMIT_REACHED",
    });
  });

  it("returns the pro-plan limit error when the user already owns the maximum number of books", async () => {
    mockBookFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });
    mockBookCountDocuments.mockResolvedValue(100);
    mockGetCurrentSubscriptionStatus.mockResolvedValue({
      plan: "pro",
      limits: {
        maxBooks: 100,
        maxSessionsPerMonth: null,
        maxSessionMinutes: 60,
        hasSessionHistory: true,
      },
      isPaid: true,
    });

    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: "user_123" });

    const result = await createBookAction({
      data: {
        title: "Another Pro Book",
        author: "Someone",
        persona: "alloy",
        fileURL: "https://example.com/book.pdf",
        fileBlobKey: "book.pdf",
        coverURL: "https://example.com/cover.png",
        fileSize: 1234,
      },
    });

    expect(Book.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error:
        "Your pro plan allows up to 100 books. Upgrade your subscription to upload more.",
      code: "BOOK_LIMIT_REACHED",
    });
  });
});

describe("saveBookSegmentAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("saves book segments", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: "user_123" });
    mockBookFindById.mockReturnValue({
      lean: vi
        .fn()
        .mockResolvedValue({ ...bookFixture(), clerkId: "user_123" }),
    });
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
    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: "user_123" });
    mockBookFindById.mockReturnValue({
      lean: vi
        .fn()
        .mockResolvedValue({ ...bookFixture(), clerkId: "user_123" }),
    });
    mockBookSegmentInsertMany.mockResolvedValue([]);
    mockBookFindByIdAndUpdate.mockResolvedValue({});

    const result = await saveBookSegmentsAction({
      bookId: "book_123",
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
    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: "user_123" });
    mockBookFindById.mockReturnValue({
      lean: vi
        .fn()
        .mockResolvedValue({ ...bookFixture(), clerkId: "user_123" }),
    });
    const error = new Error("insert failed");
    mockBookSegmentInsertMany.mockRejectedValue(error);
    mockBookSegmentDeleteMany.mockResolvedValue({});
    mockBookFindByIdAndDelete.mockResolvedValue({});

    const result = await saveBookSegmentsAction({
      bookId: "book_123",
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

  it("returns unauthorized when no user is present", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: null });

    const result = await saveBookSegmentsAction({
      bookId: "book_123",
      segments: [],
    });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(BookSegment.insertMany).not.toHaveBeenCalled();
  });

  it("returns forbidden when user does not own the book", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    (auth as unknown as Mock).mockReturnValue({ userId: "user_abc" });
    mockBookFindById.mockReturnValue({
      lean: vi
        .fn()
        .mockResolvedValue({ ...bookFixture(), clerkId: "user_123" }),
    });

    const result = await saveBookSegmentsAction({
      bookId: "book_123",
      segments: [],
    });

    expect(result).toEqual({ success: false, error: "Forbidden" });
    expect(BookSegment.insertMany).not.toHaveBeenCalled();
  });
});

describe("getBookBySlugAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("looks up books using normalized slug candidates", async () => {
    const existingBook = {
      ...bookFixture(),
      title: "Rails 5 Test Prescriptions",
      slug: "rails-5-test-prescriptions",
    };

    mockBookFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(existingBook),
    });

    const result = await getBookBySlugAction(
      "Rails%205%20Test%20Prescriptions",
    );

    expect(db.connectToDatabase).toHaveBeenCalled();
    expect(Book.findOne).toHaveBeenCalledWith({
      slug: {
        $in: [
          "Rails%205%20Test%20Prescriptions",
          "Rails 5 Test Prescriptions",
          "rails%205%20test%20prescriptions",
          "rails 5 test prescriptions",
          "rails-205-20test-20prescriptions",
          "rails-5-test-prescriptions",
        ],
      },
    });
    expect(result).toEqual({
      success: true,
      data: existingBook,
    });
  });
});
