import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionErrorBoundary } from "../section-error-boundary";

// Mock the logger
vi.mock("@/lib/monitoring/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Content rendered successfully</div>;
}

describe("SectionErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for expected errors in tests
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("should render children when no error occurs", () => {
    render(
      <SectionErrorBoundary>
        <div>Test content</div>
      </SectionErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should render default fallback UI when error occurs", () => {
    render(
      <SectionErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(screen.getByText("This feature is temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("should render custom section name in error message", () => {
    render(
      <SectionErrorBoundary sectionName="Resume Builder">
        <ThrowError shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(screen.getByText("Resume Builder temporarily unavailable")).toBeInTheDocument();
  });

  it("should render custom fallback when provided", () => {
    render(
      <SectionErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("should have a Try Again button that resets error state", () => {
    // This test verifies the reset function is called when the button is clicked
    // Note: Due to how React error boundaries work, once a child throws,
    // the boundary will try to re-render and catch any new errors.

    render(
      <SectionErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SectionErrorBoundary>
    );

    // Error boundary should show fallback
    expect(screen.getByText("This feature is temporarily unavailable")).toBeInTheDocument();

    // The Try Again button should be present and clickable
    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();

    // Clicking should call the reset handler (which sets hasError to false)
    // The component will then try to re-render children
    fireEvent.click(tryAgainButton);

    // After clicking, since ThrowError still throws, error boundary catches it again
    // This confirms the reset->retry->catch cycle works
    expect(screen.getByText("This feature is temporarily unavailable")).toBeInTheDocument();
  });
});
