"use server";

import { connectToDatabase } from "@/database/mongoose";
import type {
  CreateBook,
  CreateBookActionResult,
  IBook,
  TextSegment,
} from "@/lib/types";
import { generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

function createExistingBookResult(book: IBook): CreateBookActionResult {
  return {
    success: true as const,
    status: "existing",
    data: serializeData(book),
  };
}

export async function checkBookExistsAction(title: string) {
  try {
    await connectToDatabase();

    const slug = generateSlug(title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        exists: true,
        book: serializeData(existingBook),
      };
    }

    return {
      exists: false,
      book: null,
    };
  } catch (error) {
    console.error("Error checking book exists:", error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createBookAction({
  data,
}: {
  data: CreateBook;
}): Promise<CreateBookActionResult> {
  const slug = generateSlug(data.title);

  try {
    await connectToDatabase();

    // validate input
    // if (!data.title) {
    //   return { success: false, error: "Title is required" };
    // }

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return createExistingBookResult(existingBook);
    }

    const book = await Book.create({ ...data, slug, totalSegments: 0 });

    return {
      success: true,
      status: "created",
      data: serializeData(book),
    };
  } catch (error) {
    const isDuplicateSlugError =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000;

    if (isDuplicateSlugError) {
      try {
        await connectToDatabase();

        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
          return createExistingBookResult(existingBook);
        }
      } catch (readAfterDuplicateError) {
        console.error(
          "Error loading existing book after duplicate slug error:",
          readAfterDuplicateError,
        );
      }
    }

    console.error("Error creating book:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAllBooksAction() {
  try {
    await connectToDatabase();

    const books = await Book.find().sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: serializeData(books),
    };
  } catch (error) {
    console.error("Error getting all books:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getBookBySlugAction(slug: string) {
  try {
    await connectToDatabase();

    const normalizedCandidates = Array.from(
      new Set(
        [
          slug,
          decodeURIComponent(slug),
          slug.trim().toLowerCase(),
          decodeURIComponent(slug).trim().toLowerCase(),
          generateSlug(slug),
          generateSlug(decodeURIComponent(slug)),
        ].filter(Boolean),
      ),
    );

    const book = await Book.findOne({
      slug: { $in: normalizedCandidates },
    }).lean();

    if (!book) {
      return {
        success: false,
        data: null,
      };
    }

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (error) {
    console.error("Error getting book by slug:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function saveBookSegmentsAction({
  bookId,
  clerkId,
  segments,
}: {
  bookId: string;
  clerkId: string;
  segments: TextSegment[];
}) {
  try {
    await connectToDatabase();

    console.log("Saving book segments...");

    const segmentsToInsert = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        clerkId,
        bookId,
        content: text,
        segmentIndex,
        pageNumber,
        wordCount,
      }),
    );

    await BookSegment.insertMany(segmentsToInsert);

    await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

    console.log("Successfully saved book segments");

    return { success: true, data: { segmentsCreated: segments.length } };
  } catch (error) {
    console.error("Error saving book segments:", error);

    await BookSegment.deleteMany({ bookId });
    await Book.findByIdAndDelete(bookId);
    console.log("Deleted book segments and book due to save segments failure");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
