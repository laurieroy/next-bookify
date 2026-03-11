# Bookify

Bookify is a Next.js app for turning books into an interactive reading experience. The goal is to let users upload books, enrich them with metadata, and eventually explore them through AI-powered reading and voice features.

Right now, the project includes:

- A landing page with featured/sample books
- A form to upload a PDF and optional cover image
- Metadata inputs for title, author, and voice selection
- Validation with `react-hook-form` and `zod`
- UI components built with Tailwind CSS and shadcn-style patterns
- Vitest test setup for component testing

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Hook Form + Zod validation
- Mongoose / MongoDB
- Clerk Authentication
- Vitest

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

This project is **in active development**.

Implemented so far:

- Home page UI
- Book card display using sample data
- “Add a New Book” page
- Client-side book upload form
- File upload inputs for PDF and optional cover image
- Voice selection field
- Loading state during submission

Still in progress / not yet wired end-to-end:

- Persistent book creation
- PDF processing pipeline
- Cover auto-generation
- Voice synthesis / audio generation
- Authentication-gated workflows
- Production-ready data flow from form submission to database

## Testing

This project uses Vitest with Testing Library.

Run tests with:

```bash
pnpm test
```

## Roadmap

- Connect the upload form to a server action or API route
- Store books in MongoDB
- Parse uploaded PDFs
- Generate or upload cover images
- Add authenticated book management workflows
- Build the reading experience for uploaded books
- Add voice/audio features

## License

Private project for learning and development. 

Original project following a tutorial by [JavaScript Mastery](https://www.youtube.com/watch?v=NiwawEe92Co).

