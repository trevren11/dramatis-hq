import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ORGANIZATION_ROLE_PERMISSIONS,
  SHOW_ROLE_PERMISSIONS,
  type Permission,
} from "../types";
import { ORGANIZATION_ROLE_VALUES, SHOW_ROLE_VALUES } from "@/lib/db/schema/permissions";

describe("Permissions Types", () => {
  describe("PERMISSIONS constant", () => {
    it("should have organization-level permissions", () => {
      expect(PERMISSIONS.ORG_MANAGE_BILLING).toBe("org:manage_billing");
      expect(PERMISSIONS.ORG_TRANSFER_OWNERSHIP).toBe("org:transfer_ownership");
      expect(PERMISSIONS.ORG_MANAGE_MEMBERS).toBe("org:manage_members");
      expect(PERMISSIONS.ORG_MANAGE_SETTINGS).toBe("org:manage_settings");
      expect(PERMISSIONS.ORG_CREATE_SHOWS).toBe("org:create_shows");
      expect(PERMISSIONS.ORG_VIEW_ALL_SHOWS).toBe("org:view_all_shows");
      expect(PERMISSIONS.ORG_DELETE_SHOWS).toBe("org:delete_shows");
    });

    it("should have show-level permissions", () => {
      expect(PERMISSIONS.SHOW_VIEW).toBe("show:view");
      expect(PERMISSIONS.SHOW_EDIT).toBe("show:edit");
      expect(PERMISSIONS.SHOW_DELETE).toBe("show:delete");
      expect(PERMISSIONS.SHOW_MANAGE_STAFF).toBe("show:manage_staff");
    });

    it("should have casting permissions", () => {
      expect(PERMISSIONS.CASTING_VIEW).toBe("casting:view");
      expect(PERMISSIONS.CASTING_EDIT).toBe("casting:edit");
      expect(PERMISSIONS.CASTING_MAKE_DECISIONS).toBe("casting:make_decisions");
    });

    it("should have audition permissions", () => {
      expect(PERMISSIONS.AUDITIONS_VIEW).toBe("auditions:view");
      expect(PERMISSIONS.AUDITIONS_EDIT).toBe("auditions:edit");
      expect(PERMISSIONS.AUDITIONS_MANAGE).toBe("auditions:manage");
    });

    it("should have schedule permissions", () => {
      expect(PERMISSIONS.SCHEDULE_VIEW).toBe("schedule:view");
      expect(PERMISSIONS.SCHEDULE_EDIT).toBe("schedule:edit");
      expect(PERMISSIONS.SCHEDULE_MANAGE).toBe("schedule:manage");
    });

    it("should have notes permissions", () => {
      expect(PERMISSIONS.NOTES_VIEW_ALL).toBe("notes:view_all");
      expect(PERMISSIONS.NOTES_PRODUCTION).toBe("notes:production");
      expect(PERMISSIONS.NOTES_LIGHTING).toBe("notes:lighting");
      expect(PERMISSIONS.NOTES_SOUND).toBe("notes:sound");
      expect(PERMISSIONS.NOTES_COSTUME).toBe("notes:costume");
      expect(PERMISSIONS.NOTES_SCENIC).toBe("notes:scenic");
      expect(PERMISSIONS.NOTES_PROPS).toBe("notes:props");
      expect(PERMISSIONS.NOTES_HAIR_MAKEUP).toBe("notes:hair_makeup");
      expect(PERMISSIONS.NOTES_CHOREOGRAPHY).toBe("notes:choreography");
      expect(PERMISSIONS.NOTES_DRAMATURG).toBe("notes:dramaturg");
      expect(PERMISSIONS.NOTES_AD).toBe("notes:ad");
    });

    it("should have budget permissions", () => {
      expect(PERMISSIONS.BUDGET_VIEW).toBe("budget:view");
      expect(PERMISSIONS.BUDGET_EDIT).toBe("budget:edit");
      expect(PERMISSIONS.BUDGET_MANAGE).toBe("budget:manage");
      expect(PERMISSIONS.BUDGET_PROPS).toBe("budget:props");
    });

    it("should have communication permissions", () => {
      expect(PERMISSIONS.COMMUNICATION_SEND).toBe("communication:send");
      expect(PERMISSIONS.COMMUNICATION_VIEW).toBe("communication:view");
    });

    it("should have materials permissions", () => {
      expect(PERMISSIONS.MATERIALS_VIEW).toBe("materials:view");
      expect(PERMISSIONS.MATERIALS_UPLOAD).toBe("materials:upload");
      expect(PERMISSIONS.MATERIALS_MANAGE).toBe("materials:manage");
      expect(PERMISSIONS.TRACKS_VIEW).toBe("tracks:view");
      expect(PERMISSIONS.TRACKS_MANAGE).toBe("tracks:manage");
    });

    it("should have call sheets permissions", () => {
      expect(PERMISSIONS.CALLSHEETS_VIEW).toBe("callsheets:view");
      expect(PERMISSIONS.CALLSHEETS_EDIT).toBe("callsheets:edit");
    });
  });

  describe("ORGANIZATION_ROLE_PERMISSIONS", () => {
    it("should have permissions defined for all organization roles", () => {
      for (const role of ORGANIZATION_ROLE_VALUES) {
        expect(ORGANIZATION_ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ORGANIZATION_ROLE_PERMISSIONS[role])).toBe(true);
        expect(ORGANIZATION_ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      }
    });

    it("should give owner all org management permissions", () => {
      const ownerPermissions = ORGANIZATION_ROLE_PERMISSIONS.owner;
      expect(ownerPermissions).toContain(PERMISSIONS.ORG_MANAGE_BILLING);
      expect(ownerPermissions).toContain(PERMISSIONS.ORG_TRANSFER_OWNERSHIP);
      expect(ownerPermissions).toContain(PERMISSIONS.ORG_MANAGE_MEMBERS);
      expect(ownerPermissions).toContain(PERMISSIONS.ORG_MANAGE_SETTINGS);
      expect(ownerPermissions).toContain(PERMISSIONS.ORG_CREATE_SHOWS);
      expect(ownerPermissions).toContain(PERMISSIONS.ORG_VIEW_ALL_SHOWS);
      expect(ownerPermissions).toContain(PERMISSIONS.ORG_DELETE_SHOWS);
    });

    it("should not give admin billing or transfer permissions", () => {
      const adminPermissions = ORGANIZATION_ROLE_PERMISSIONS.admin;
      expect(adminPermissions).not.toContain(PERMISSIONS.ORG_MANAGE_BILLING);
      expect(adminPermissions).not.toContain(PERMISSIONS.ORG_TRANSFER_OWNERSHIP);
      expect(adminPermissions).toContain(PERMISSIONS.ORG_MANAGE_MEMBERS);
    });

    it("should give producer ability to create shows", () => {
      const producerPermissions = ORGANIZATION_ROLE_PERMISSIONS.producer;
      expect(producerPermissions).toContain(PERMISSIONS.ORG_CREATE_SHOWS);
      expect(producerPermissions).toContain(PERMISSIONS.ORG_VIEW_ALL_SHOWS);
    });

    it("should not give producer member management", () => {
      const producerPermissions = ORGANIZATION_ROLE_PERMISSIONS.producer;
      expect(producerPermissions).not.toContain(PERMISSIONS.ORG_MANAGE_MEMBERS);
    });

    it("should give associate_producer view-only permissions", () => {
      const apPermissions = ORGANIZATION_ROLE_PERMISSIONS.associate_producer;
      expect(apPermissions).toContain(PERMISSIONS.ORG_VIEW_ALL_SHOWS);
      expect(apPermissions).toContain(PERMISSIONS.SHOW_VIEW);
      expect(apPermissions).not.toContain(PERMISSIONS.ORG_CREATE_SHOWS);
      expect(apPermissions).not.toContain(PERMISSIONS.SHOW_DELETE);
    });

    it("should have owner permissions be a superset of admin permissions", () => {
      const ownerPermissions = new Set(ORGANIZATION_ROLE_PERMISSIONS.owner);
      const adminPermissions = ORGANIZATION_ROLE_PERMISSIONS.admin;

      // Admin should have all permissions except billing/ownership transfer
      const adminOnlyExpectedExclusions = [
        PERMISSIONS.ORG_MANAGE_BILLING,
        PERMISSIONS.ORG_TRANSFER_OWNERSHIP,
      ];

      for (const permission of adminPermissions) {
        expect(ownerPermissions.has(permission)).toBe(true);
      }

      for (const exclusion of adminOnlyExpectedExclusions) {
        expect(adminPermissions).not.toContain(exclusion);
      }
    });
  });

  describe("SHOW_ROLE_PERMISSIONS", () => {
    it("should have permissions defined for all show roles", () => {
      for (const role of SHOW_ROLE_VALUES) {
        expect(SHOW_ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(SHOW_ROLE_PERMISSIONS[role])).toBe(true);
        expect(SHOW_ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      }
    });

    it("should give director full show management", () => {
      const directorPermissions = SHOW_ROLE_PERMISSIONS.director;
      expect(directorPermissions).toContain(PERMISSIONS.SHOW_VIEW);
      expect(directorPermissions).toContain(PERMISSIONS.SHOW_EDIT);
      expect(directorPermissions).toContain(PERMISSIONS.SHOW_MANAGE_STAFF);
      expect(directorPermissions).toContain(PERMISSIONS.CASTING_MAKE_DECISIONS);
    });

    it("should give stage_manager schedule management", () => {
      const smPermissions = SHOW_ROLE_PERMISSIONS.stage_manager;
      expect(smPermissions).toContain(PERMISSIONS.SCHEDULE_VIEW);
      expect(smPermissions).toContain(PERMISSIONS.SCHEDULE_EDIT);
      expect(smPermissions).toContain(PERMISSIONS.SCHEDULE_MANAGE);
      expect(smPermissions).toContain(PERMISSIONS.CALLSHEETS_EDIT);
    });

    it("should give music_director track management", () => {
      const mdPermissions = SHOW_ROLE_PERMISSIONS.music_director;
      expect(mdPermissions).toContain(PERMISSIONS.TRACKS_VIEW);
      expect(mdPermissions).toContain(PERMISSIONS.TRACKS_MANAGE);
    });

    it("should give choreographer choreography notes", () => {
      const choreoPermissions = SHOW_ROLE_PERMISSIONS.choreographer;
      expect(choreoPermissions).toContain(PERMISSIONS.NOTES_CHOREOGRAPHY);
    });

    it("should give production_manager budget management", () => {
      const pmPermissions = SHOW_ROLE_PERMISSIONS.production_manager;
      expect(pmPermissions).toContain(PERMISSIONS.BUDGET_VIEW);
      expect(pmPermissions).toContain(PERMISSIONS.BUDGET_EDIT);
      expect(pmPermissions).toContain(PERMISSIONS.BUDGET_MANAGE);
    });

    it("should give crew_member minimal permissions", () => {
      const crewPermissions = SHOW_ROLE_PERMISSIONS.crew_member;
      expect(crewPermissions).toContain(PERMISSIONS.SHOW_VIEW);
      expect(crewPermissions).toContain(PERMISSIONS.SCHEDULE_VIEW);
      expect(crewPermissions).toContain(PERMISSIONS.CALLSHEETS_VIEW);
      expect(crewPermissions).toHaveLength(3);
    });

    it("should give all roles SHOW_VIEW permission", () => {
      for (const role of SHOW_ROLE_VALUES) {
        expect(SHOW_ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.SHOW_VIEW);
      }
    });

    it("should give all roles CALLSHEETS_VIEW permission", () => {
      for (const role of SHOW_ROLE_VALUES) {
        expect(SHOW_ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.CALLSHEETS_VIEW);
      }
    });

    it("should give designers their department-specific notes permissions", () => {
      expect(SHOW_ROLE_PERMISSIONS.lighting_designer).toContain(PERMISSIONS.NOTES_LIGHTING);
      expect(SHOW_ROLE_PERMISSIONS.sound_designer).toContain(PERMISSIONS.NOTES_SOUND);
      expect(SHOW_ROLE_PERMISSIONS.costume_designer).toContain(PERMISSIONS.NOTES_COSTUME);
      expect(SHOW_ROLE_PERMISSIONS.scenic_designer).toContain(PERMISSIONS.NOTES_SCENIC);
      expect(SHOW_ROLE_PERMISSIONS.props_master).toContain(PERMISSIONS.NOTES_PROPS);
      expect(SHOW_ROLE_PERMISSIONS.hair_makeup_designer).toContain(PERMISSIONS.NOTES_HAIR_MAKEUP);
    });

    it("should not give designers other department notes", () => {
      expect(SHOW_ROLE_PERMISSIONS.lighting_designer).not.toContain(PERMISSIONS.NOTES_SOUND);
      expect(SHOW_ROLE_PERMISSIONS.sound_designer).not.toContain(PERMISSIONS.NOTES_LIGHTING);
    });
  });

  describe("Permission uniqueness", () => {
    it("should have unique permission values", () => {
      const values = Object.values(PERMISSIONS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });

    it("should have no duplicate permissions within a role", () => {
      // Check organization roles
      for (const role of ORGANIZATION_ROLE_VALUES) {
        const permissions = ORGANIZATION_ROLE_PERMISSIONS[role];
        const uniquePermissions = new Set(permissions);
        expect(permissions.length).toBe(uniquePermissions.size);
      }

      // Check show roles
      for (const role of SHOW_ROLE_VALUES) {
        const permissions = SHOW_ROLE_PERMISSIONS[role];
        const uniquePermissions = new Set(permissions);
        expect(permissions.length).toBe(uniquePermissions.size);
      }
    });
  });

  describe("Permission type safety", () => {
    it("should only use valid permission values in role mappings", () => {
      const validPermissions = new Set(Object.values(PERMISSIONS) as Permission[]);

      // Check organization roles
      for (const role of ORGANIZATION_ROLE_VALUES) {
        for (const permission of ORGANIZATION_ROLE_PERMISSIONS[role]) {
          expect(validPermissions.has(permission)).toBe(true);
        }
      }

      // Check show roles
      for (const role of SHOW_ROLE_VALUES) {
        for (const permission of SHOW_ROLE_PERMISSIONS[role]) {
          expect(validPermissions.has(permission)).toBe(true);
        }
      }
    });
  });
});
