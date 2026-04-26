import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HeadshotsSection } from "../headshots-section";
import type { Headshot } from "@/lib/db/schema/headshots";

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

describe("HeadshotsSection", () => {
  const mockHeadshot: Headshot = {
    id: "headshot-1",
    talentProfileId: "profile-1",
    url: "http://localhost:9000/headshots/test.webp",
    thumbnailUrl: "http://localhost:9000/headshots/test-thumb.webp",
    originalFilename: "test.jpg",
    mimeType: "image/webp",
    fileSize: 1024000,
    width: 800,
    height: 1200,
    isPrimary: true,
    sortOrder: 0,
    uploadedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.URL.createObjectURL = vi.fn(() => "blob:test");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders empty state when no headshots", () => {
    render(<HeadshotsSection initialData={[]} />);

    expect(screen.getByText(/No headshots uploaded yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
  });

  it("renders existing headshots", () => {
    render(<HeadshotsSection initialData={[mockHeadshot]} />);

    expect(screen.getByAltText("Headshot")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  it("shows headshot count", () => {
    render(<HeadshotsSection initialData={[mockHeadshot]} />);

    expect(screen.getByText(/1\/10/)).toBeInTheDocument();
  });

  it("validates file type before upload", () => {
    render(<HeadshotsSection initialData={[]} />);

    const input = document.querySelector('input[type="file"]');
    if (!input) throw new Error("Input not found");
    const invalidFile = new File(["test"], "test.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "Invalid file type",
      })
    );
  });

  it("validates file size before upload", () => {
    render(<HeadshotsSection initialData={[]} />);

    const input = document.querySelector('input[type="file"]');
    if (!input) throw new Error("Input not found");
    // Create a file larger than 10MB
    const largeContent = new Array(11 * 1024 * 1024).fill("a").join("");
    const largeFile = new File([largeContent], "large.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "File too large",
      })
    );
  });

  it("uploads file to storage first, then creates headshot record", async () => {
    const uploadResponse = {
      url: "http://localhost:9000/headshots/uploaded.webp",
      width: 800,
      height: 1200,
    };

    const headshotResponse = {
      headshot: {
        ...mockHeadshot,
        id: "new-headshot",
        url: uploadResponse.url,
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(uploadResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(headshotResponse),
      });

    render(<HeadshotsSection initialData={[]} />);

    const input = document.querySelector('input[type="file"]');
    if (!input) throw new Error("Input not found");
    const validFile = new File(["test image content"], "photo.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      // First call should be to upload endpoint with FormData
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/upload/image",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      );
    });

    await waitFor(() => {
      // Second call should be to headshots endpoint with the real URL
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/talent/headshots",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining(uploadResponse.url),
        })
      );
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Success",
          description: "Headshot uploaded",
        })
      );
    });
  });

  it("does NOT use blob URLs for storage", async () => {
    const uploadResponse = {
      url: "http://localhost:9000/headshots/real-url.webp",
      width: 800,
      height: 1200,
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(uploadResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ headshot: mockHeadshot }),
      });

    render(<HeadshotsSection initialData={[]} />);

    const input = document.querySelector('input[type="file"]');
    if (!input) throw new Error("Input not found");
    const validFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      const headshotsCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === "/api/talent/headshots"
      );
      expect(headshotsCall).toBeDefined();
      if (!headshotsCall) throw new Error("Headshots call not found");
      const body = JSON.parse(headshotsCall[1].body as string);
      // URL should NOT be a blob URL
      expect(body.url).not.toMatch(/^blob:/);
      // URL should be the real storage URL
      expect(body.url).toBe(uploadResponse.url);
    });
  });

  it("handles upload failure gracefully", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Storage error" }),
    });

    render(<HeadshotsSection initialData={[]} />);

    const input = document.querySelector('input[type="file"]');
    if (!input) throw new Error("Input not found");
    const validFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Upload failed",
          description: "Storage error",
        })
      );
    });
  });

  it("can set a headshot as primary", async () => {
    const nonPrimaryHeadshot = { ...mockHeadshot, isPrimary: false };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ headshot: { ...nonPrimaryHeadshot, isPrimary: true } }),
    });

    render(<HeadshotsSection initialData={[nonPrimaryHeadshot]} />);

    // Hover over the image to show controls
    const imageContainer = screen.getByAltText("Headshot").closest(".group");
    if (!imageContainer) throw new Error("Image container not found");
    fireEvent.mouseEnter(imageContainer);

    const setPrimaryButton = screen.getByRole("button", { name: /Set Primary/i });
    fireEvent.click(setPrimaryButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/talent/headshots/${nonPrimaryHeadshot.id}`,
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ isPrimary: true }),
        })
      );
    });
  });

  it("can delete a headshot", async () => {
    global.confirm = vi.fn(() => true);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<HeadshotsSection initialData={[mockHeadshot]} />);

    // Hover over the image to show controls
    const imageContainer = screen.getByAltText("Headshot").closest(".group");
    if (!imageContainer) throw new Error("Image container not found");
    fireEvent.mouseEnter(imageContainer);

    const deleteButton = screen.getByRole("button", { name: "" }); // Trash icon button
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/talent/headshots/${mockHeadshot.id}`,
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("shows maximum headshots message when limit reached", () => {
    const tenHeadshots = Array.from({ length: 10 }, (_, i) => ({
      ...mockHeadshot,
      id: `headshot-${String(i)}`,
      isPrimary: i === 0,
    }));

    render(<HeadshotsSection initialData={tenHeadshots} />);

    expect(screen.getByText(/Maximum headshots reached/i)).toBeInTheDocument();
    expect(screen.getByText(/10\/10/)).toBeInTheDocument();
  });
});
