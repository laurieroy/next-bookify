import { describe, it, expect } from "vitest";
import { generateSlug, splitIntoSegments } from "./utils";

describe("generateSlug", () => {
  it("handles an empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  it("slugifies spaces into hyphens", () => {
    expect(generateSlug("My Book")).toBe("my-book");
  });

  it("removes file extensions", () => {
    expect(generateSlug("My Book.pdf")).toBe("my-book");
  });

  it("drops text after colon", () => {
    expect(generateSlug("My Book: Chapter 1.pdf")).toBe("my-book");
  });

  it("drops removes special characters without joining words incorrectly", () => {
    expect(generateSlug("My Book & Title.pdf")).toBe("my-book-title");
  });
  it("collapses repeated separators and trims edges", () => {
    expect(generateSlug("  My---Book___Title!! ")).toBe("my-book-title");
  });
});

describe("splitIntoSegments", () => {
  it("returns no segments for empty input", () => {
    expect(splitIntoSegments("")).toEqual([]);
  });

  it("returns no segments for whitespace-only input", () => {
    expect(splitIntoSegments("   ")).toEqual([]);
  });

  it("returns one segment for text shorter than segment size", () => {
    expect(splitIntoSegments("hello world", 5, 1)).toEqual([
      {
        text: "hello world",
        segmentIndex: 0,
        wordCount: 2,
      },
    ]);
  });

  it("returns one segment when text length matches segment size exactly", () => {
    expect(splitIntoSegments("one two three four five", 5, 1)).toEqual([
      {
        text: "one two three four five",
        segmentIndex: 0,
        wordCount: 5,
      },
    ]);
  });

  it("splits text into multiple segments without overlap", () => {
    expect(
      splitIntoSegments("one two three four five six seven eight", 5, 0),
    ).toEqual([
      {
        text: "one two three four five",
        segmentIndex: 0,
        wordCount: 5,
      },
      {
        text: "six seven eight",
        segmentIndex: 1,
        wordCount: 3,
      },
    ]);
  });

  it("splits text into overlapping segments", () => {
    expect(
      splitIntoSegments("one two three four five six seven eight", 5, 2),
    ).toEqual([
      {
        text: "one two three four five",
        segmentIndex: 0,
        wordCount: 5,
      },
      {
        text: "four five six seven eight",
        segmentIndex: 1,
        wordCount: 5,
      },
    ]);
  });

  it("normalizes irregular whitespace in segment text", () => {
    expect(splitIntoSegments("one   two\nthree\tfour", 10, 0)).toEqual([
      {
        text: "one two three four",
        segmentIndex: 0,
        wordCount: 4,
      },
    ]);
  });

  it("throws when segmentSize is 0 or less", () => {
    expect(() => splitIntoSegments("one two", 0, 0)).toThrow(
      "segmentSize must be greater than 0",
    );
    expect(() => splitIntoSegments("one two", -1, 0)).toThrow(
      "segmentSize must be greater than 0",
    );
  });

  it("throws when overlapSize is negative", () => {
    expect(() => splitIntoSegments("one two", 5, -1)).toThrow(
      "overlapSize must be >= 0 and < segmentSize",
    );
  });

  it("throws when overlapSize is equal to or greater than segmentSize", () => {
    expect(() => splitIntoSegments("one two", 5, 5)).toThrow(
      "overlapSize must be >= 0 and < segmentSize",
    );
    expect(() => splitIntoSegments("one two", 5, 6)).toThrow(
      "overlapSize must be >= 0 and < segmentSize",
    );
  });
});
