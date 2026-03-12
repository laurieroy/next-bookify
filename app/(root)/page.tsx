import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import { getAllBooksAction } from "@/lib/actions/book.actions";

export default async function Home() {
  const booksResult = await getAllBooksAction();
  const books = booksResult.success ? (booksResult.data ?? []) : [];

  return (
    <main className="wrapper container">
      <HeroSection />

      <div className="library-books-grid">
        {books.map((book) => (
          <BookCard key={book._id} {...book} />
        ))}
      </div>
    </main>
  );
}
