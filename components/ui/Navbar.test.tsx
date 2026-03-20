import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import Navbar from "./Navbar";

const clerkState = vi.hoisted(() => ({
  signedIn: false,
  firstName: "Taylor",
}));

vi.mock("@clerk/nextjs", () => ({
  Show: ({
    when,
    children,
  }: {
    children: ReactNode;
    when: "signed-in" | "signed-out";
  }) => {
    const shouldRender =
      (when === "signed-in" && clerkState.signedIn) ||
      (when === "signed-out" && !clerkState.signedIn);

    return shouldRender ? <>{children}</> : null;
  },
  SignInButton: () => <button type="button">Sign in</button>,
  SignUpButton: () => <button type="button">Sign up</button>,
  UserButton: () => <button aria-label="User profile" type="button" />,
  useUser: () => ({
    user: clerkState.signedIn ? { firstName: clerkState.firstName } : null,
  }),
}));

vi.mock("next/image", () => ({
  default: () => <span data-testid="bookify-logo" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Navbar", () => {
  beforeEach(() => {
    clerkState.signedIn = false;
    clerkState.firstName = "Taylor";
  });

  it("shows sign in, sign up, and pricing when signed out", () => {
    render(<Navbar />);

    const nav = screen.getByRole("navigation");
    const links = within(nav).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Library",
      "New Book",
      "Pricing",
    ]);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/subscriptions",
    );
  });

  it("shows the user profile when signed in", () => {
    clerkState.signedIn = true;
    clerkState.firstName = "Laurie";

    render(<Navbar />);

    expect(
      screen.getByRole("button", { name: "User profile" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Laurie" })).toHaveAttribute(
      "href",
      "/subscriptions",
    );
    expect(
      screen.queryByRole("button", { name: "Sign in" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign up" }),
    ).not.toBeInTheDocument();
  });
});
