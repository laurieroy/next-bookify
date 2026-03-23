import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IBook } from "@/lib/types";

import Page from "./page";

const authMock = vi.hoisted(() => vi.fn());
const getBookBySlugActionMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/actions/book.actions", () => ({
  getBookBySlugAction: getBookBySlugActionMock,
}));

vi.mock("@/components/VapiControls", () => ({
  default: ({ book }: { book: IBook }) => (
    <section data-testid="vapi-controls">{book.title}</section>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function createBook(): IBook {
  const mockId = { toString: () => "book_1" } as unknown as IBook["_id"];

  return {
    _id: mockId,
    clerkId: "user_123",
    title: "Test Book",
    slug: "test-book",
    author: "Author",
    persona: "iP95p4xoKVk53GoZ742B",
    fileURL: "",
    fileBlobKey: "",
    coverURL: "",
    fileSize: 0,
    totalSegments: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IBook;
}

describe("BookDetailsPage", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ userId: "user_123" });
    getBookBySlugActionMock.mockResolvedValue({
      success: true,
      data: createBook(),
    });
  });

  it("renders the fetched book conversation shell", async () => {
    render(
      await Page({
        params: Promise.resolve({ slug: "test-book" }),
      }),
    );

    expect(getBookBySlugActionMock).toHaveBeenCalledWith("test-book");
    expect(
      screen.getByRole("link", { name: "Back to library" }),
    ).toHaveAttribute("href", "/#library");
    expect(screen.getByTestId("vapi-controls")).toHaveTextContent("Test Book");
  });
});
