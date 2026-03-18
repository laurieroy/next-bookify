import { Document, Types } from "mongoose";
import { ReactNode } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { LucideIcon } from "lucide-react";
import z from "zod";

import { PlanType } from "@/lib/subscription-constants";
import { UploadSchema } from "@/lib/zod";

// ============================================
// DATABASE MODELS
// ============================================

export interface IBook extends Document {
  _id: Types.ObjectId;
  clerkId: string;
  title: string;
  slug: string;
  author: string;
  persona?: string;
  fileURL: string;
  fileBlobKey: string;
  coverURL: string;
  coverBlobKey?: string;
  fileSize: number;
  totalSegments: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookSegment extends Document {
  clerkId: string;
  bookId: Types.ObjectId;
  content: string;
  segmentIndex: number;
  pageNumber?: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVoiceSession extends Document {
  _id: Types.ObjectId;
  clerkId: string;
  bookId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  billingPeriodStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// FORM & INPUT TYPES
// ============================================

export type BookUploadFormValues = z.infer<typeof UploadSchema>;

export interface BookCardProps {
  title: string;
  author: string;
  coverURL: string;
  slug: string;
}

export interface CreateBook {
  title: string;
  author: string;
  persona?: string;
  fileURL: string;
  fileBlobKey: string;
  coverURL?: string;
  coverBlobKey?: string;
  fileSize: number;
}

export interface Messages {
  role: string;
  content: string;
}

export interface ShadowBoxProps {
  children: ReactNode;
  className?: string;
}

export interface TextSegment {
  text: string;
  segmentIndex: number;
  pageNumber?: number;
  wordCount: number;
}

export interface FileUploadFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  acceptTypes: string[];
  disabled?: boolean;
  icon: LucideIcon;
  placeholder: string;
  hint: string;
}

export interface InputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

// ============================================
// ACTIONS & RESULTS
// ============================================

export type CreateBookActionResult =
  | { success: true; status: "created"; data: IBook }
  | { success: true; status: "existing"; data: IBook }
  | { success: false; error: string };

// Book actions
export type CheckBookExistsResult =
  | { exists: true; book: IBook }
  | { exists: false; book: null; error?: string };

export interface EndSessionResult {
  success: boolean;
  error?: string;
}

export type GetAllBooksResult =
  | { success: true; data: IBook[] }
  | { success: false; error: string };

export type GetBookBySlugResult =
  | { success: true; data: IBook }
  | { success: false; data: null; error?: string };

export type SaveBookSegmentsResult =
  | { success: true; data: { segmentsCreated: number } }
  | { success: false; error: string };

export interface SegmentSearchResultItem {
  _id: string;
  bookId: string;
  content: string;
  segmentIndex: number;
  pageNumber?: number;
  wordCount: number;
}

export type SearchBookSegmentsResult =
  | { success: true; data: SegmentSearchResultItem[] }
  | { success: false; error: string; data: [] };

export interface SessionCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  plan: PlanType;
  maxDurationMinutes: number;
  error?: string;
}

export interface StartSessionResult {
  success: boolean;
  sessionId?: string;
  maxDurationMinutes?: number;
  error?: string;
  isBillingError?: boolean;
}

export interface VoiceSelectorProps {
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange: (voiceId: string) => void;
}
