import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmailTemplateEditor } from "../notifications/EmailTemplateEditor";

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("EmailTemplateEditor", () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render editor with empty fields for new template", () => {
    render(<EmailTemplateEditor onSave={mockOnSave} />);

    expect(screen.getByLabelText(/template name/i)).toHaveValue("");
    expect(screen.getByLabelText(/subject line/i)).toHaveValue("");
    expect(screen.getByLabelText(/email body/i)).toHaveValue("");
  });

  it("should render editor with template data for existing template", () => {
    const template = {
      id: "1",
      organizationId: "org-1",
      name: "Test Template",
      type: "cast_notification" as const,
      subject: "Test Subject",
      body: "<p>Test Body</p>",
      isDefault: false,
      isActive: true,
      mergeFields: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<EmailTemplateEditor template={template} onSave={mockOnSave} />);

    expect(screen.getByLabelText(/template name/i)).toHaveValue("Test Template");
    expect(screen.getByLabelText(/subject line/i)).toHaveValue("Test Subject");
    expect(screen.getByLabelText(/email body/i)).toHaveValue("<p>Test Body</p>");
  });

  it("should show merge fields panel", () => {
    render(<EmailTemplateEditor onSave={mockOnSave} />);

    expect(screen.getByText("Merge Fields")).toBeInTheDocument();
    expect(screen.getByText("Talent Full Name")).toBeInTheDocument();
    expect(screen.getByText("Role Name")).toBeInTheDocument();
    expect(screen.getByText("Show Title")).toBeInTheDocument();
  });

  it("should have both edit and preview tabs", () => {
    render(<EmailTemplateEditor onSave={mockOnSave} />);

    expect(screen.getByRole("tab", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /preview/i })).toBeInTheDocument();
  });

  it("should update input values", () => {
    render(<EmailTemplateEditor onSave={mockOnSave} />);

    const nameInput = screen.getByLabelText(/template name/i);
    fireEvent.change(nameInput, { target: { value: "New Template" } });
    expect(nameInput).toHaveValue("New Template");

    const subjectInput = screen.getByLabelText(/subject line/i);
    fireEvent.change(subjectInput, { target: { value: "New Subject" } });
    expect(subjectInput).toHaveValue("New Subject");
  });

  it("should call onSave when save button is clicked", () => {
    mockOnSave.mockResolvedValue(undefined);
    render(<EmailTemplateEditor onSave={mockOnSave} />);

    fireEvent.change(screen.getByLabelText(/template name/i), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByLabelText(/subject line/i), {
      target: { value: "Subject" },
    });
    fireEvent.change(screen.getByLabelText(/email body/i), {
      target: { value: "Body" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save template/i }));

    expect(mockOnSave).toHaveBeenCalledWith({
      name: "Test",
      type: "custom",
      subject: "Subject",
      body: "Body",
      isDefault: false,
    });
  });

  it("should call onCancel when cancel button is clicked", () => {
    render(<EmailTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("should reset form when reset button is clicked", () => {
    const template = {
      id: "1",
      organizationId: "org-1",
      name: "Original Name",
      type: "cast_notification" as const,
      subject: "Original Subject",
      body: "Original Body",
      isDefault: false,
      isActive: true,
      mergeFields: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<EmailTemplateEditor template={template} onSave={mockOnSave} />);

    const nameInput = screen.getByLabelText(/template name/i);
    fireEvent.change(nameInput, { target: { value: "Changed Name" } });
    expect(nameInput).toHaveValue("Changed Name");

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(nameInput).toHaveValue("Original Name");
  });

  it("should disable save button when required fields are empty", () => {
    render(<EmailTemplateEditor onSave={mockOnSave} />);

    const saveButton = screen.getByRole("button", { name: /save template/i });
    expect(saveButton).toBeDisabled();
  });

  it("should enable save button when all required fields are filled", () => {
    render(<EmailTemplateEditor onSave={mockOnSave} />);

    fireEvent.change(screen.getByLabelText(/template name/i), {
      target: { value: "Name" },
    });
    fireEvent.change(screen.getByLabelText(/subject line/i), {
      target: { value: "Subject" },
    });
    fireEvent.change(screen.getByLabelText(/email body/i), {
      target: { value: "Body" },
    });

    const saveButton = screen.getByRole("button", { name: /save template/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("should have preview tab available", () => {
    render(<EmailTemplateEditor onSave={mockOnSave} />);

    const previewTab = screen.getByRole("tab", { name: /preview/i });
    expect(previewTab).toBeInTheDocument();
  });
});

describe("EmailTemplateEditor merge field insertion", () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show merge fields panel", () => {
    render(<EmailTemplateEditor onSave={mockOnSave} />);
    expect(screen.getByText("Talent Full Name")).toBeInTheDocument();
  });
});
