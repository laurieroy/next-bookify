"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  DEFAULT_VOICE,
} from "@/lib/constants";
import { BookUploadFormValues } from "@/lib/types";
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

export function NewBookForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookUploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      pdfFile: undefined,
      coverImage: undefined,
      title: "",
      author: "",
      voice: DEFAULT_VOICE,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1200);
      });

      console.log("Book upload form submitted", values);
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

          <VoiceSelectorField form={form} name="voice" disabled={isSubmitting} />

          <Button type="submit" disabled={isSubmitting} className="form-btn">
            Begin Synthesis
          </Button>
        </form>
      </Form>
    </>
  );
}
