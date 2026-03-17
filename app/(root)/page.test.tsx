import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";

import Page from "./page";

vi.mock("@/database/mongoose", () => ({ default: { connect: vi.fn() } }));

test("Page", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Bookify" }),
  ).toBeDefined();
});
