// @vitest-environment node

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

import { createBookAction, saveBookSegmentsAction } from "./book.actions";
import * as db from "@/database/mongoose";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

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
const mockBookCreate = Book.create as Mock;
const mockBookFindByIdAndUpdate = Book.findByIdAndUpdate as Mock;
const mockBookFindByIdAndDelete = Book.findByIdAndDelete as Mock;
const mockBookSegmentInsertMany = BookSegment.insertMany as Mock;
const mockBookSegmentDeleteMany = BookSegment.deleteMany as Mock;

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
        clerkId: "user_123",
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
      alreadyExists: true,
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

    const result = await createBookAction({
      data: {
        clerkId: "user_123",
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
      alreadyExists: true,
    });
  });
});

describe("saveBookSegmentAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("saves book segments", async () => {
    const result = await saveBookSegmentsAction({
      bookId: "book_123",
      clerkId: "user_123",
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
    mockBookSegmentInsertMany.mockResolvedValue([]);
    mockBookFindByIdAndUpdate.mockResolvedValue({});

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
    mockBookSegmentInsertMany.mockRejectedValue(error);
    mockBookSegmentDeleteMany.mockResolvedValue({});
    mockBookFindByIdAndDelete.mockResolvedValue({});

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
