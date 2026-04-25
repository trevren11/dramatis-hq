import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TalentCard, TalentCardSkeleton, type TalentCardData } from "../casting/TalentCard";
import { TierGroup } from "../casting/TierGroup";
import { PresenceIndicators, buildPresenceMap } from "../casting/PresenceIndicators";

vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    isOver: false,
    setNodeRef: vi.fn(),
  }),
}));

describe("TalentCard", () => {
  const mockTalent: TalentCardData = {
    id: "talent-1",
    firstName: "John",
    lastName: "Doe",
    stageName: null,
    primaryHeadshotUrl: null,
    isLocked: false,
    status: "draft",
    location: "pool",
  };

  it("should render talent name", () => {
    render(<TalentCard talent={mockTalent} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should render stage name when provided", () => {
    const talentWithStageName = { ...mockTalent, stageName: "Johnny D" };
    render(<TalentCard talent={talentWithStageName} />);
    expect(screen.getByText("Johnny D")).toBeInTheDocument();
  });

  it("should show lock icon when locked", () => {
    const lockedTalent = { ...mockTalent, isLocked: true };
    render(<TalentCard talent={lockedTalent} showStatus />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("should render compact version", () => {
    render(<TalentCard talent={mockTalent} compact />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should show status badge when showStatus is true", () => {
    render(<TalentCard talent={mockTalent} showStatus />);
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("should call onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(<TalentCard talent={mockTalent} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("John Doe"));
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("TalentCardSkeleton", () => {
  it("should render skeleton", () => {
    const { container } = render(<TalentCardSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("should render compact skeleton", () => {
    const { container } = render(<TalentCardSkeleton compact />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});

describe("TierGroup", () => {
  it("should render title and count", () => {
    render(
      <TierGroup title="Leads" count={2} totalSlots={3}>
        <div>Children</div>
      </TierGroup>
    );
    expect(screen.getByText("Leads")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("should show children when expanded", () => {
    render(
      <TierGroup title="Leads" count={2} totalSlots={3} defaultExpanded>
        <div>Test Children</div>
      </TierGroup>
    );
    expect(screen.getByText("Test Children")).toBeInTheDocument();
  });

  it("should toggle expansion on click", () => {
    render(
      <TierGroup title="Leads" count={2} totalSlots={3} defaultExpanded>
        <div>Test Children</div>
      </TierGroup>
    );
    expect(screen.getByText("Test Children")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Leads"));
    expect(screen.queryByText("Test Children")).not.toBeInTheDocument();
  });
});

describe("PresenceIndicators", () => {
  it("should return null when no users", () => {
    const { container } = render(<PresenceIndicators users={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should show user initials", () => {
    render(
      <PresenceIndicators
        users={[
          {
            id: "1",
            userName: "John Doe",
            color: "#ff0000",
            cursorPosition: null,
            selectedTalentId: null,
          },
        ]}
      />
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should show overflow indicator for many users", () => {
    const users = Array.from({ length: 7 }, (_, i) => ({
      id: String(i),
      userName: `User ${String(i)}`,
      color: "#ff0000",
      cursorPosition: null,
      selectedTalentId: null,
    }));
    render(<PresenceIndicators users={users} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});

describe("buildPresenceMap", () => {
  it("should build map from users with selected talent", () => {
    const users = [
      {
        id: "1",
        userName: "John",
        color: "#ff0000",
        cursorPosition: null,
        selectedTalentId: "talent-1",
      },
      { id: "2", userName: "Jane", color: "#00ff00", cursorPosition: null, selectedTalentId: null },
    ];
    const map = buildPresenceMap(users);
    expect(map["talent-1"]).toEqual({ name: "John", color: "#ff0000" });
    expect(Object.keys(map).length).toBe(1);
  });

  it("should handle empty users array", () => {
    const map = buildPresenceMap([]);
    expect(Object.keys(map).length).toBe(0);
  });

  it("should use default color when not provided", () => {
    const users = [
      {
        id: "1",
        userName: "John",
        color: null,
        cursorPosition: null,
        selectedTalentId: "talent-1",
      },
    ];
    const map = buildPresenceMap(users);
    expect(map["talent-1"]?.color).toBe("#6b7280");
  });
});
