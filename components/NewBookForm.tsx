"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import z from "zod";

import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  DEFAULT_VOICE,
} from "@/lib/constants";
import type { BookUploadFormValues, CreateBookActionResult } from "@/lib/types";
import { UploadSchema } from "@/lib/zod";
import { FileUploader } from "@/components/FileUploader";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { VoiceSelectorField } from "@/components/VoiceSelectorField";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  checkBookExistsAction,
  createBookAction,
  saveBookSegmentsAction,
} from "@/lib/actions/book.actions";
import { parsePDFFile } from "@/lib/utils";

export function NewBookForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userId } = useAuth();

  const form = useForm<
    z.input<typeof UploadSchema>,
    unknown,
    BookUploadFormValues
  >({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      pdfFile: undefined,
      coverImage: undefined,
      title: "",
      author: "",
      persona: DEFAULT_VOICE,
    },
  });

  const redirectToExistingBook = (slug: string, message: string) => {
    toast.info(message);
    form.reset();
    router.push(`/books/${slug}`);
  };

  const handleSubmit = form.handleSubmit(async (data: BookUploadFormValues) => {
    if (!userId) {
      return toast.error("Please login to upload books");
    }

    setIsSubmitting(true);

    // PostHog => Track book uploads

    try {
      const existsCheck = await checkBookExistsAction(data.title);

      if (existsCheck && existsCheck.book) {
        redirectToExistingBook(
          existsCheck.book.slug,
          "Book with this title already exists",
        );
        return;
      }

      const fileTitle =
        data.title.replace(/\s+/g, "-").toLowerCase() || "untitled";
      const pdfFile = data.pdfFile;

      const parsedPdf = await parsePDFFile(pdfFile);

      if (parsedPdf.content.length === 0) {
        toast.error(
          "No content found in the PDF file. Try again with a different file.",
        );
        return;
      }

      const uploadedPdfBlob = await upload(fileTitle, pdfFile, {
        access: "public",
        contentType: "application/pdf",
        handleUploadUrl: "/api/upload",
      });

      let coverUrl: string | undefined;

      if (data.coverImage && data.coverImage.size > 0) {
        const coverFile = data.coverImage;
        const uploadedCoverBlob = await upload(
          `${fileTitle}-cover.png`,
          coverFile,
          {
            access: "public",
            contentType: coverFile.type,
            handleUploadUrl: "/api/upload",
          },
        );

        coverUrl = uploadedCoverBlob.url;
      } else {
        const response = await fetch(parsedPdf.cover);
        const blob = await response.blob();
        const uploadedCoverBlob = await upload(`${fileTitle}-cover.png`, blob, {
          access: "public",
          contentType: "image/png",
          handleUploadUrl: "/api/upload",
        });
        coverUrl = uploadedCoverBlob.url;
      }

      console.log("Book upload form submitted", data);
      const book = await createBookAction({
        data: {
          clerkId: userId,
          title: data.title,
          author: data.author,
          fileURL: uploadedPdfBlob.url,
          fileBlobKey: uploadedPdfBlob.pathname,
          coverURL: coverUrl,
          persona: data.persona,
          fileSize: pdfFile.size,
        },
      });

      if (!book.success) {
        throw new Error("Failed to create book.");
      }

      if (book.status === "existing") {
        redirectToExistingBook(book.data.slug, "Book already exists.");
        return;
      }

      console.log("Book created", book);

      const segments = await saveBookSegmentsAction({
        clerkId: userId,
        bookId: book.data._id,
        segments: parsedPdf.content,
      });

      if (!segments.success) {
        toast.error("Failed to save book segments.");
        throw new Error("Failed to save book segments.");
      }

      form.reset();
      router.push("/");
    } catch (error) {
      console.error("Error uploading book", error);
      toast.error("Error uploading book. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      {isSubmitting ? <LoadingOverlay /> : null}

      <Form {...form}>
        <form onSubmit={handleSubmit} className="new-book-wrapper space-y-8">
          <FileUploader
            control={form.control}
            name="pdfFile"
            label="PDF file upload"
            acceptTypes={ACCEPTED_PDF_TYPES}
            disabled={isSubmitting}
            icon={Upload}
            placeholder="Click to upload PDF"
            hint="PDF file (max 50MB)"
          />

          <FileUploader
            control={form.control}
            name="coverImage"
            label="Cover image upload (optional)"
            acceptTypes={ACCEPTED_IMAGE_TYPES}
            disabled={isSubmitting}
            icon={ImageIcon}
            placeholder="Click to upload cover image"
            hint="Leave empty to auto-generate from PDF"
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Title</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    disabled={isSubmitting}
                    placeholder="ex: Rich Dad Poor Dad"
                    className="form-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Author Name</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    disabled={isSubmitting}
                    placeholder="ex: Robert Kiyosaki"
                    className="form-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <VoiceSelectorField
            form={form}
            name="persona"
            disabled={isSubmitting}
          />

          <Button type="submit" disabled={isSubmitting} className="form-btn">
            Begin Synthesis
          </Button>
        </form>
      </Form>
    </>
  );
}
