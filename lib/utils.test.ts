import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { generateSlug, parsePDFFile, splitIntoSegments } from "./utils";

const getDocumentMock = vi.fn();

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: getDocumentMock,
}));

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

describe("parsePDFFile", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window",
  );
  const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    } else {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }

    if (originalDocumentDescriptor) {
      Object.defineProperty(globalThis, "document", originalDocumentDescriptor);
    } else {
      Object.defineProperty(globalThis, "document", {
        value: originalDocument,
        configurable: true,
        writable: true,
      });
    }
  });

  it("returns cover data URL and segmented content for a valid PDF", async () => {
    const arrayBuffer = new ArrayBuffer(8);
    const mockFile = {
      arrayBuffer: vi.fn().mockResolvedValue(arrayBuffer),
    } as unknown as File;

    const renderPromise = Promise.resolve();
    const renderMock = vi.fn().mockReturnValue({ promise: renderPromise });

    const firstPage = {
      getViewport: vi.fn().mockReturnValue({ width: 120, height: 240 }),
      render: renderMock,
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: "Hello" }, { str: "world" }, { notStr: "ignored" }],
      }),
    };

    const secondPage = {
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: "Second" }, { str: "page" }],
      }),
    };

    const destroyMock = vi.fn().mockResolvedValue(undefined);
    const getPageMock = vi
      .fn()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    getDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: getPageMock,
        destroy: destroyMock,
      }),
    });

    const context = { mocked: true };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(context),
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mock-cover"),
    };

    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: {
        createElement: vi.fn().mockReturnValue(canvas),
      },
      configurable: true,
      writable: true,
    });

    const result = await parsePDFFile(mockFile);

    expect(getDocumentMock).toHaveBeenCalledWith({ data: arrayBuffer });
    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(240);
    expect(firstPage.getViewport).toHaveBeenCalledWith({ scale: 2 });
    expect(renderMock).toHaveBeenCalledWith({
      canvasContext: context,
      viewport: { width: 120, height: 240 },
    });
    expect(result.cover).toBe("data:image/png;base64,mock-cover");
    expect(result.content).toEqual([
      {
        text: "Hello world Second page",
        segmentIndex: 0,
        wordCount: 4,
      },
    ]);
    expect(destroyMock).toHaveBeenCalled();
  });

  it("ignores text content items without a str property", async () => {
    const mockFile = {
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    const page = {
      getViewport: vi.fn().mockReturnValue({ width: 10, height: 20 }),
      render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: "Only" }, { value: "skip-me" }, { str: "text" }],
      }),
    };

    getDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(page),
        destroy: vi.fn().mockResolvedValue(undefined),
      }),
    });

    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: {
        createElement: vi.fn().mockReturnValue({
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue({}),
          toDataURL: vi.fn().mockReturnValue("data:image/png;base64,test"),
        }),
      },
      configurable: true,
      writable: true,
    });

    const result = await parsePDFFile(mockFile);

    expect(result.content).toEqual([
      {
        text: "Only text",
        segmentIndex: 0,
        wordCount: 2,
      },
    ]);
  });

  it("throws a wrapped error when canvas context is unavailable", async () => {
    const mockFile = {
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    const page = {
      getViewport: vi.fn().mockReturnValue({ width: 10, height: 20 }),
    };

    getDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(page),
        destroy: vi.fn().mockResolvedValue(undefined),
      }),
    });

    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: {
        createElement: vi.fn().mockReturnValue({
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(null),
        }),
      },
      configurable: true,
      writable: true,
    });

    await expect(parsePDFFile(mockFile)).rejects.toThrow(
      "Failed to parse PDF file: Could not get canvas context",
    );
  });

  it("throws a wrapped error when file reading fails", async () => {
    const mockFile = {
      arrayBuffer: vi.fn().mockRejectedValue(new Error("read failed")),
    } as unknown as File;

    await expect(parsePDFFile(mockFile)).rejects.toThrow(
      "Failed to parse PDF file: read failed",
    );
  });

  it("throws a wrapped error when PDF loading fails", async () => {
    const mockFile = {
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    getDocumentMock.mockReturnValue({
      promise: Promise.reject(new Error("invalid pdf")),
    });

    await expect(parsePDFFile(mockFile)).rejects.toThrow(
      "Failed to parse PDF file: invalid pdf",
    );
  });

  it("throws a wrapped error when render fails", async () => {
    const mockFile = {
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    const page = {
      getViewport: vi.fn().mockReturnValue({ width: 10, height: 20 }),
      render: vi.fn().mockReturnValue({
        promise: Promise.reject(new Error("render failed")),
      }),
    };

    getDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(page),
        destroy: vi.fn().mockResolvedValue(undefined),
      }),
    });

    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: {
        createElement: vi.fn().mockReturnValue({
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue({}),
          toDataURL: vi.fn().mockReturnValue("data:image/png;base64,test"),
        }),
      },
      configurable: true,
      writable: true,
    });

    await expect(parsePDFFile(mockFile)).rejects.toThrow(
      "Failed to parse PDF file: render failed",
    );
  });
});
