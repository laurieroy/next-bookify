# Bookify

Bookify is a "talk-to-your-book" app where users upload PDFs, the app extracts and stores the content, and then a voice AI assistant discusses, explains, or tutors the user on that book.

Right now, the project includes:

- A landing page with user-supplied books
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
- Vapi for voice AI conversations
- Vercel Blob for file storage
- Vitest

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Update .env.local

Copy the `.env.local.example` file to `.env.local` and update the values with your own. You will need to create a MongoDB database, a Clerk account and Vercel to store your data and authentication.

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
- Persistent book creation
- PDF processing pipeline
- Cover auto-generation
- Voice synthesis / audio generation
- Subscription management

Still in progress / not yet wired end-to-end:

- Authentication-gated workflows
- Production-ready data flow from form submission to database
- Over-limit handling + UI
- Update auth pages to app branding

## Testing

This project uses Vitest with Testing Library.

Run tests with:

```bash
pnpm test
pnpm test:frontend
pnpm test:backend
```

## Roadmap

- Connect the upload form to a server action or API route
- Store books in MongoDB
- Parse uploaded PDFs
- Generate or upload cover images
- Add authenticated book management workflows
- Build the reading experience for uploaded books
- Add voice/audio features
- Server side authentication with Clerk instead of relying on UI-only auth


## License

Private project for learning and development. 

Implemented features:
- Home page UI
- Book card display using sample data
- "Add a New Book" page
- Client-side book upload form
- File upload inputs for PDF and optional cover image
- Voice selection field
- Loading state during submission


Original project following a tutorial by [JavaScript Mastery](https://www.youtube.com/watch?v=NiwawEe92Co).

