import { NewBookForm } from "@/components/NewBookForm";

export default function AddBookPage() {
  return (
    <main className="wrapper container">
      <div className="mx-auto max-w-180 space-y-10">
        <section className="flex flex-col gap-5">
          <h1 className="page-title-xl">Add a New Book</h1>
          <p className="subtitle">
            Upload a pdf to generate your interactive reading experience
          </p>
        </section>

        <NewBookForm />
      </div>
    </main>
  );
}
