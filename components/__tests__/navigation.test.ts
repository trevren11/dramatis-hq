import { describe, it, expect } from "vitest";
import { talentNavItems, producerNavItems } from "@/lib/navigation";

describe("talentNavItems", () => {
  it("contains dashboard as first item", () => {
    const firstItem = talentNavItems[0];
    expect(firstItem).toBeDefined();
    expect(firstItem?.title).toBe("Dashboard");
    expect(firstItem?.href).toBe("/talent");
  });

  it("contains browse auditions item with badge", () => {
    const auditionsItem = talentNavItems.find((item) => item.title === "Browse Auditions");
    expect(auditionsItem).toBeDefined();
    expect(auditionsItem?.badge).toBe("12 new");
  });

  it("contains profile with nested children", () => {
    const profileItem = talentNavItems.find((item) => item.title === "My Profile");
    expect(profileItem).toBeDefined();
    expect(profileItem?.children).toHaveLength(2);
    expect(profileItem?.children?.[0]?.title).toBe("Portfolio");
  });

  it("has icons for all top-level items", () => {
    talentNavItems.forEach((item) => {
      expect(item.icon).toBeDefined();
    });
  });
});

describe("producerNavItems", () => {
  it("contains dashboard as first item", () => {
    const firstItem = producerNavItems[0];
    expect(firstItem).toBeDefined();
    expect(firstItem?.title).toBe("Dashboard");
    expect(firstItem?.href).toBe("/producer");
  });

  it("contains projects item with nested children", () => {
    const projectsItem = producerNavItems.find((item) => item.title === "Projects");
    expect(projectsItem).toBeDefined();
    expect(projectsItem?.children).toHaveLength(2);
    expect(projectsItem?.children?.[0]?.title).toBe("Create Project");
  });

  it("contains casting item with badge", () => {
    const castingItem = producerNavItems.find((item) => item.title === "Casting");
    expect(castingItem).toBeDefined();
    expect(castingItem?.badge).toBe("5 pending");
  });

  it("has icons for all top-level items", () => {
    producerNavItems.forEach((item) => {
      expect(item.icon).toBeDefined();
    });
  });

  it("contains reports and contracts items", () => {
    expect(producerNavItems.find((item) => item.title === "Reports")).toBeDefined();
    expect(producerNavItems.find((item) => item.title === "Contracts")).toBeDefined();
  });
});
