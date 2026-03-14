import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getBookBySlugAction } from "@/lib/actions/book.actions";

type BookDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BookDetailsPage({
  params,
}: BookDetailsPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { slug } = await params;
  const result = await getBookBySlugAction(slug);

  if (!result.success || !result.data) {
    redirect("/");
  }

  const book = result.data;

  return (
    <>
      <Link
        href="/#library"
        className="back-btn-floating"
        aria-label="Back to library"
      >
        <ArrowLeft className="size-5 text-[#212a3b]" />
      </Link>

      <main className="book-page-container">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <section className="vapi-header-card flex-col items-start sm:flex-row">
            <div className="vapi-cover-wrapper">
              <Image
                src={book.coverURL || ""}
                alt={book.title}
                width={120}
                height={180}
                className="vapi-cover-image h-auto w-[120px]"
              />

              <div className="vapi-mic-wrapper">
                <button
                  type="button"
                  className="vapi-mic-btn"
                  aria-label="Microphone disabled"
                >
                  <MicOff className="size-6 text-[#212a3b]" />
                </button>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4 self-center sm:self-auto">
              <div className="space-y-1.5">
                <h1 className="font-serif text-2xl font-bold text-[#212a3b] sm:text-3xl">
                  {book.title}
                </h1>
                <p className="text-base text-[#5c4a3a] sm:text-lg">
                  by {book.author}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="vapi-status-indicator">
                  <span className="vapi-status-dot vapi-status-dot-ready" />
                  <span className="vapi-status-text">Ready</span>
                </div>

                <div className="vapi-status-indicator">
                  <span className="vapi-status-text">
                    Voice: {book.persona ?? "Unknown"}
                  </span>
                </div>

                <div className="vapi-status-indicator">
                  <span className="vapi-status-text">0:00/15:00</span>
                </div>
              </div>
            </div>
          </section>

          <section className="transcript-container min-h-[400px]">
            <div className="transcript-empty">
              <Mic className="mb-4 size-12 text-[#212a3b]" />
              <p className="transcript-empty-text">No conversation yet</p>
              <p className="transcript-empty-hint">
                Click the mic button above to start talking
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
