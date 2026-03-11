import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import { sampleBooks } from "@/lib/constants";

export default function Home() {
  return (
    <main className="wrapper container">
      <HeroSection />

      <div className="library-books-grid">
        {sampleBooks.map((book) => (
          <BookCard key={book._id} {...book} />
        ))}
      </div>
    </main>
  );
}
