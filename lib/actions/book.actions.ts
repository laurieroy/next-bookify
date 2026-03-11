"use server";

import { connectToDatabase } from "@/database/mongoose";
import type { CreateBook, TextSegment } from "./../types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function checkBookExists(title: string) {
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
      error: (error as Error).message,
    };
  }
}

export async function createBookAction({ data }: { data: CreateBook }) {
  try {
    await connectToDatabase();

    // validate input
    // if (!data.title) {
    //   return { success: false, error: "Title is required" };
    // }

    const slug = generateSlug(data.title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true,
      };
    }

    // TODO:check subscription limits before creating a book

    const book = await Book.create({ ...data, slug, totalSegments: 0 });

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (error) {
    console.error("Error creating book:", error);
    return {
      success: false,
      error: (error as Error) ? error.message : "Unknown error",
    };
  }
}

export async function saveBookSegments({
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
      error: (error as Error).message,
    };
  }
}
