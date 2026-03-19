import { z } from "zod";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  voiceOptions,
} from "@/lib/constants";

const pdfFileSchema = z
  .instanceof(File, { message: "Please upload a PDF file." })
  .refine((file) => ACCEPTED_PDF_TYPES.includes(file.type), {
    message: "The uploaded file must be a PDF.",
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: `PDF file must be ${MAX_FILE_SIZE}MB or smaller.`,
  });

const imageFileSchema = z
  .instanceof(File, { message: "Please upload a valid image file." })
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: "Cover image must be a JPG, PNG, or WebP file.",
  })
  .refine((file) => file.size <= MAX_IMAGE_SIZE, {
    message: "Cover image must be 10MB or smaller.",
  });

export const UploadSchema = z.object({
  pdfFile: pdfFileSchema,
  coverImage: imageFileSchema.optional(),
  title: z.string().trim().min(1, "Title is required."),
  author: z.string().trim().min(1, "Author name is required."),
  persona: z.enum(
    Object.values(voiceOptions).map((voice) => voice.id) as [
      string,
      ...string[],
    ],
    { message: "Please choose an assistant voice." },
  ),
});
