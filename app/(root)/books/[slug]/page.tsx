import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { getBookBySlugAction } from "@/lib/actions/book.actions";
import VapiControls from "@/components/VapiControls";

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
        <VapiControls book={book} />
      </main>
    </>
  );
}
