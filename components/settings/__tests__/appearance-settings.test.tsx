import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeSelector, LanguageSelector, TimezoneSelector } from "../appearance-settings";

describe("ThemeSelector", () => {
  const mockOnThemeChange = vi.fn();

  beforeEach(() => {
    mockOnThemeChange.mockClear();
  });

  it("renders all theme options", () => {
    render(<ThemeSelector theme="system" onThemeChange={mockOnThemeChange} isPending={false} />);

    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("highlights the selected theme", () => {
    render(<ThemeSelector theme="dark" onThemeChange={mockOnThemeChange} isPending={false} />);

    const darkButton = screen.getByRole("button", { name: /Dark/i });
    expect(darkButton).toHaveClass("border-primary");
  });

  it("calls onThemeChange when a theme is selected", () => {
    render(<ThemeSelector theme="system" onThemeChange={mockOnThemeChange} isPending={false} />);

    fireEvent.click(screen.getByRole("button", { name: /Light/i }));
    expect(mockOnThemeChange).toHaveBeenCalledWith("light");
  });

  it("disables buttons when isPending is true", () => {
    render(<ThemeSelector theme="system" onThemeChange={mockOnThemeChange} isPending={true} />);

    expect(screen.getByRole("button", { name: /Light/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Dark/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /System/i })).toBeDisabled();
  });
});

describe("LanguageSelector", () => {
  const mockOnLanguageChange = vi.fn();

  beforeEach(() => {
    mockOnLanguageChange.mockClear();
  });

  it("renders the language selector", () => {
    render(
      <LanguageSelector language="en" onLanguageChange={mockOnLanguageChange} isPending={false} />
    );

    // Check for the combobox and description text
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText(/Select your preferred language/i)).toBeInTheDocument();
  });

  it("displays the current language value", () => {
    render(
      <LanguageSelector language="en" onLanguageChange={mockOnLanguageChange} isPending={false} />
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});

describe("TimezoneSelector", () => {
  const mockOnTimezoneChange = vi.fn();

  beforeEach(() => {
    mockOnTimezoneChange.mockClear();
  });

  it("renders the timezone selector", () => {
    render(
      <TimezoneSelector
        timezone="America/New_York"
        onTimezoneChange={mockOnTimezoneChange}
        isPending={false}
      />
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays the current time in selected timezone", () => {
    render(
      <TimezoneSelector timezone="UTC" onTimezoneChange={mockOnTimezoneChange} isPending={false} />
    );

    // The component should show current time text
    expect(screen.getByText(/Current time in selected timezone/i)).toBeInTheDocument();
  });
});
