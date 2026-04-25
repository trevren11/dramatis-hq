import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsNav, SettingsMobileNav } from "../settings-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/settings/account",
}));

describe("SettingsNav", () => {
  it("renders all navigation items", () => {
    render(<SettingsNav />);

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("Security")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("renders navigation links with correct hrefs", () => {
    render(<SettingsNav />);

    expect(screen.getByRole("link", { name: /Account/i })).toHaveAttribute(
      "href",
      "/settings/account"
    );
    expect(screen.getByRole("link", { name: /Profile/i })).toHaveAttribute(
      "href",
      "/settings/profile"
    );
    expect(screen.getByRole("link", { name: /Notifications/i })).toHaveAttribute(
      "href",
      "/settings/notifications"
    );
    expect(screen.getByRole("link", { name: /Privacy/i })).toHaveAttribute(
      "href",
      "/settings/privacy"
    );
    expect(screen.getByRole("link", { name: /Security/i })).toHaveAttribute(
      "href",
      "/settings/security"
    );
    expect(screen.getByRole("link", { name: /Appearance/i })).toHaveAttribute(
      "href",
      "/settings/appearance"
    );
  });

  it("highlights the active navigation item", () => {
    render(<SettingsNav />);

    const accountLink = screen.getByRole("link", { name: /Account/i });
    expect(accountLink).toHaveAttribute("aria-current", "page");
    expect(accountLink).toHaveClass("bg-primary/10");
  });

  it("renders with proper accessibility attributes", () => {
    render(<SettingsNav />);

    const nav = screen.getByRole("navigation", { name: "Settings navigation" });
    expect(nav).toBeInTheDocument();
  });
});

describe("SettingsMobileNav", () => {
  it("renders all navigation items", () => {
    render(<SettingsMobileNav />);

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("Security")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("highlights the active navigation item", () => {
    render(<SettingsMobileNav />);

    const accountLink = screen.getByRole("link", { name: /Account/i });
    expect(accountLink).toHaveAttribute("aria-current", "page");
    expect(accountLink).toHaveClass("bg-primary");
  });
});
