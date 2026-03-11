import { IBookSegment } from "@/lib/types";
import { Schema, model, models } from "mongoose";

const BookSegmentSchema = new Schema<IBookSegment>(
  {
    clerkId: { type: String, required: true },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    content: { type: String, required: true },
    segmentIndex: { type: Number, required: true },
    pageNumber: { type: Number },
    wordCount: { type: Number, required: true },
  },
  { timestamps: true },
);

BookSegmentSchema.index({ bookId: 1, segmentIndex: 1 }, { unique: true });
BookSegmentSchema.index({ clerkId: 1, bookId: 1 });

BookSegmentSchema.index({ bookId: 1, content: "text" });
const BookSegment =
  models.BookSegment || model<IBookSegment>("BookSegment", BookSegmentSchema);

export default BookSegment;
