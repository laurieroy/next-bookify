# Bookify

Bookify is a "talk-to-your-book" app where users upload PDFs, the app extracts and stores the content, and a voice AI assistant discusses, explains, or tutors the user on that book.

## Overview

The current app includes:

- A MongoDB-backed home library that renders real book data
- An "Add a New Book" flow for uploading PDFs and optional cover images
- Auth-gated book detail pages with Vapi voice controls
- A subscriptions page with plan comparison and upgrade actions
- Server actions for creating books, storing segments, and reading subscription status

## Key Routes

- `/` — home page and book library
- `/books/new` — upload a new book
- `/books/[slug]` — book detail page with the voice assistant experience
- `/subscriptions` — billing and plan comparison

## How It Works

1. Sign in with Clerk.
2. Upload a PDF, add metadata, and optionally provide a cover image.
3. Parse the PDF content and upload files to Vercel Blob.
4. Create the book in MongoDB and save its segments.
5. Open the book page and talk with the Vapi assistant.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Hook Form + Zod validation
- Mongoose / MongoDB
- Clerk Authentication
- Vapi for voice AI conversations
- Vercel Blob for file storage
- Vitest

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `bookify_READ_WRITE_TOKEN`*
- `NEXT_PUBLIC_ASSISTANT_ID`
- `NEXT_PUBLIC_VAPI_API_KEY`

You will need accounts or projects configured for Clerk, MongoDB, Vercel Blob, and Vapi.
* When creating the Vercel Blob token, make sure to capitalize BOOKIFY (or other chosen project name) so the token is named BOOKIFY_READ_WRITE_TOKEN

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Install dependencies

```bash
pnpm install
```

### Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Current Status

This project is in active development.

### Implemented

- Real book library on the home page
- Book upload page and form
- PDF parsing and cover handling
- Book creation and segment persistence
- Auth-gated book detail pages
- Subscription comparison page
- Vapi-based voice experience
- Vitest test setup

### Still being refined

- Edge-case handling in the upload flow
- Auth page branding and polish
- Over-limit UX and messaging
- Multiple author support

## Testing

This project uses Vitest with Testing Library.

Run tests with:

```bash
pnpm test
pnpm test:frontend
pnpm test:backend
```

## License

Private project for learning and development.

Original project following a tutorial by [JavaScript Mastery](https://www.youtube.com/watch?v=NiwawEe92Co).
