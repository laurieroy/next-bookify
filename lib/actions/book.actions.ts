"use server";

import mongoose from "mongoose";
import type { Types } from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/database/mongoose";
import { getCurrentSubscriptionStatus } from "@/lib/subscription.server";
import type {
  CreateBook,
  CreateBookActionResult,
  IBook,
  TextSegment,
  CheckBookExistsResult,
  GetAllBooksResult,
  GetBookBySlugResult,
  SaveBookSegmentsResult,
  SearchBookSegmentsResult,
  SegmentSearchResultItem,
} from "@/lib/types";
import { escapeRegex, generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

function createExistingBookResult(book: IBook): CreateBookActionResult {
  return {
    success: true as const,
    status: "existing",
    data: serializeData(book),
  };
}

export async function checkBookExistsAction(
  title: string,
): Promise<CheckBookExistsResult> {
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
      book: null,
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

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const subscription = await getCurrentSubscriptionStatus();
    const currentBookCount = await Book.countDocuments({ clerkId: userId });

    if (currentBookCount >= subscription.limits.maxBooks) {
      return {
        success: false,
        error: `Your ${subscription.plan} plan allows up to ${subscription.limits.maxBooks} book${subscription.limits.maxBooks === 1 ? "" : "s"}. Upgrade your subscription to upload more.`,
        code: "BOOK_LIMIT_REACHED",
      };
    }

    const book = await Book.create({
      ...data,
      clerkId: userId,
      slug,
      totalSegments: 0,
    });

    revalidatePath("/");

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

export async function getAllBooksAction(): Promise<GetAllBooksResult> {
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

export async function getBookBySlugAction(
  slug: string,
): Promise<GetBookBySlugResult> {
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
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function saveBookSegmentsAction({
  bookId,
  segments,
}: {
  bookId: string | Types.ObjectId;
  segments: TextSegment[];
}): Promise<SaveBookSegmentsResult> {
  try {
    await connectToDatabase();

    console.log("Saving book segments...");

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const book = await Book.findById(bookId).lean();
    if (!book || book.clerkId !== userId) {
      return { success: false, error: "Forbidden" };
    }

    const segmentsToInsert = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        clerkId: userId,
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

export const searchBookSegmentsAction = async (
  bookId: string,
  query: string,
  limit: number = 5,
): Promise<SearchBookSegmentsResult> => {
  try {
    await connectToDatabase();

    console.log(`Searching for: "${query}" in book ${bookId}`);

    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    // Try MongoDB text search first (requires text index)
    let segments: unknown[] = [];
    try {
      segments = await BookSegment.find({
        bookId: bookObjectId,
        $text: { $search: query },
      })
        .select("_id bookId content segmentIndex pageNumber wordCount")
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();
    } catch {
      // Text index may not exist — fall through to regex fallback
      segments = [];
    }

    // Fallback: regex search matching ANY keyword
    if (segments.length === 0) {
      const keywords = query.split(/\s+/).filter((k) => k.length > 2);
      const pattern = keywords.map(escapeRegex).join("|");

      if (keywords.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      segments = await BookSegment.find({
        bookId: bookObjectId,
        content: { $regex: pattern, $options: "i" },
      })
        .select("_id bookId content segmentIndex pageNumber wordCount")
        .sort({ segmentIndex: 1 })
        .limit(limit)
        .lean();
    }

    console.log(`Search complete. Found ${segments.length} results`);

    return {
      success: true,
      data: serializeData(segments) as unknown as SegmentSearchResultItem[],
    };
  } catch (error) {
    console.error("Error searching segments:", error);
    return {
      success: false,
      error: (error as Error).message,
      data: [],
    };
  }
};
