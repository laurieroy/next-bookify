import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import Page from "./page";

vi.mock("@/lib/actions/book.actions", () => ({
  getAllBooksAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

test("renders the homepage heading", async () => {
  render(await Page());

  expect(
    screen.getByRole("heading", { level: 1, name: "Your Library" }),
  ).toBeInTheDocument();
});
