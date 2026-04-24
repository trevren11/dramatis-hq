import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageContainer, PageHeader } from "@/components/layout/page-container";

vi.mock("next/navigation", () => ({
  usePathname: () => "/talent",
}));

describe("Header", () => {
  it("renders logo", () => {
    render(<Header />);
    expect(screen.getByText("Dramatis")).toBeInTheDocument();
    expect(screen.getByText("HQ")).toBeInTheDocument();
  });

  it("renders search input on desktop", () => {
    render(<Header />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders notification button", () => {
    render(<Header />);
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("calls onMenuClick when menu button is clicked", () => {
    const onMenuClick = vi.fn();
    render(<Header onMenuClick={onMenuClick} />);

    const menuButton = screen.getByRole("button", { name: /open menu/i });
    fireEvent.click(menuButton);

    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it("displays user avatar with initials", () => {
    render(<Header user={{ name: "John Doe", email: "john@example.com" }} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});

describe("Footer", () => {
  it("renders logo", () => {
    render(<Footer />);
    expect(screen.getByText("Dramatis")).toBeInTheDocument();
    expect(screen.getByText("HQ")).toBeInTheDocument();
  });

  it("renders talent links", () => {
    render(<Footer />);
    expect(screen.getByText("For Talent")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse Auditions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Your Profile" })).toBeInTheDocument();
  });

  it("renders producer links", () => {
    render(<Footer />);
    expect(screen.getByText("For Producers")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Your Projects" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage Castings" })).toBeInTheDocument();
  });

  it("renders copyright with current year", () => {
    render(<Footer />);
    const currentYear = String(new Date().getFullYear());
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
  });
});

describe("PageContainer", () => {
  it("renders children", () => {
    render(<PageContainer>Test Content</PageContainer>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies default max width", () => {
    const { container } = render(<PageContainer>Content</PageContainer>);
    expect(container.firstChild).toHaveClass("max-w-screen-xl");
  });

  it("applies custom max width", () => {
    const { container } = render(<PageContainer maxWidth="sm">Content</PageContainer>);
    expect(container.firstChild).toHaveClass("max-w-screen-sm");
  });
});

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByRole("heading", { name: "Test Title" })).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<PageHeader title="Title" description="Test description" />);
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(<PageHeader title="Title" actions={<button>Action</button>} />);
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});
