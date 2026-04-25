import { describe, it, expect } from "vitest";
import {
  departmentCreateSchema,
  departmentUpdateSchema,
  folderCreateSchema,
  noteCreateSchema,
  noteUpdateSchema,
  noteAutoSaveSchema,
  commentCreateSchema,
  commentUpdateSchema,
  commentResolveSchema,
  memberAddSchema,
  memberUpdateSchema,
  templateCreateSchema,
  activityQuerySchema,
  bulkDepartmentReorderSchema,
  initializeDepartmentsSchema,
} from "../production-notes";

describe("departmentCreateSchema", () => {
  it("should validate valid department data", () => {
    const result = departmentCreateSchema.safeParse({
      name: "Lighting",
      type: "lighting",
      description: "Lighting department notes",
      color: "#fbbf24",
    });
    expect(result.success).toBe(true);
  });

  it("should use default values", () => {
    const result = departmentCreateSchema.safeParse({
      name: "Custom Department",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("custom");
      expect(result.data.sortOrder).toBe(0);
    }
  });

  it("should reject empty name", () => {
    const result = departmentCreateSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject name over 100 characters", () => {
    const result = departmentCreateSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid color format", () => {
    const result = departmentCreateSchema.safeParse({
      name: "Test",
      color: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid hex color", () => {
    const result = departmentCreateSchema.safeParse({
      name: "Test",
      color: "#ff5500",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid department type", () => {
    const result = departmentCreateSchema.safeParse({
      name: "Test",
      type: "invalid_type",
    });
    expect(result.success).toBe(false);
  });
});

describe("departmentUpdateSchema", () => {
  it("should validate partial updates", () => {
    const result = departmentUpdateSchema.safeParse({
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("should validate isActive update", () => {
    const result = departmentUpdateSchema.safeParse({
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = departmentUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("folderCreateSchema", () => {
  it("should validate valid folder data", () => {
    const result = folderCreateSchema.safeParse({
      name: "Documents",
      sortOrder: 1,
    });
    expect(result.success).toBe(true);
  });

  it("should validate folder with parent", () => {
    const result = folderCreateSchema.safeParse({
      name: "Subfolder",
      parentFolderId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = folderCreateSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid parent UUID", () => {
    const result = folderCreateSchema.safeParse({
      name: "Test",
      parentFolderId: "invalid-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("noteCreateSchema", () => {
  it("should validate valid note data", () => {
    const result = noteCreateSchema.safeParse({
      title: "Light Plot Notes",
      content: "<p>Notes content here</p>",
      accessLevel: "department_member",
    });
    expect(result.success).toBe(true);
  });

  it("should use default values", () => {
    const result = noteCreateSchema.safeParse({
      title: "New Note",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDraft).toBe(false);
      expect(result.data.isPinned).toBe(false);
      expect(result.data.accessLevel).toBe("department_member");
    }
  });

  it("should reject empty title", () => {
    const result = noteCreateSchema.safeParse({
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject title over 255 characters", () => {
    const result = noteCreateSchema.safeParse({
      title: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid access level", () => {
    const result = noteCreateSchema.safeParse({
      title: "Test",
      accessLevel: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("noteUpdateSchema", () => {
  it("should validate partial updates", () => {
    const result = noteUpdateSchema.safeParse({
      content: "Updated content",
    });
    expect(result.success).toBe(true);
  });

  it("should validate version save request", () => {
    const result = noteUpdateSchema.safeParse({
      title: "Updated Title",
      saveVersion: true,
      changesSummary: "Fixed typos",
    });
    expect(result.success).toBe(true);
  });

  it("should reject changes summary over 500 characters", () => {
    const result = noteUpdateSchema.safeParse({
      saveVersion: true,
      changesSummary: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("noteAutoSaveSchema", () => {
  it("should validate auto save data", () => {
    const result = noteAutoSaveSchema.safeParse({
      content: "Auto saved content",
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional title", () => {
    const result = noteAutoSaveSchema.safeParse({
      content: "Content",
      title: "New Title",
    });
    expect(result.success).toBe(true);
  });
});

describe("commentCreateSchema", () => {
  it("should validate valid comment", () => {
    const result = commentCreateSchema.safeParse({
      content: "This is a comment",
    });
    expect(result.success).toBe(true);
  });

  it("should validate comment with parent", () => {
    const result = commentCreateSchema.safeParse({
      content: "This is a reply",
      parentCommentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should validate comment with mentions", () => {
    const result = commentCreateSchema.safeParse({
      content: "Hey @user check this",
      mentions: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const result = commentCreateSchema.safeParse({
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject content over 5000 characters", () => {
    const result = commentCreateSchema.safeParse({
      content: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});

describe("commentUpdateSchema", () => {
  it("should validate content update", () => {
    const result = commentUpdateSchema.safeParse({
      content: "Updated comment",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const result = commentUpdateSchema.safeParse({
      content: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("commentResolveSchema", () => {
  it("should validate resolve true", () => {
    const result = commentResolveSchema.safeParse({
      isResolved: true,
    });
    expect(result.success).toBe(true);
  });

  it("should validate resolve false", () => {
    const result = commentResolveSchema.safeParse({
      isResolved: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("memberAddSchema", () => {
  it("should validate valid member add", () => {
    const result = memberAddSchema.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      role: "Designer",
      canEdit: true,
    });
    expect(result.success).toBe(true);
  });

  it("should use default values", () => {
    const result = memberAddSchema.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.canEdit).toBe(false);
      expect(result.data.canDelete).toBe(false);
      expect(result.data.canManageFiles).toBe(false);
    }
  });

  it("should reject invalid user UUID", () => {
    const result = memberAddSchema.safeParse({
      userId: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("memberUpdateSchema", () => {
  it("should validate partial updates", () => {
    const result = memberUpdateSchema.safeParse({
      canEdit: true,
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = memberUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("templateCreateSchema", () => {
  it("should validate valid template", () => {
    const result = templateCreateSchema.safeParse({
      name: "Light Plot Template",
      content: "<h1>Light Plot</h1><p>Content here</p>",
      departmentType: "lighting",
      isDefault: true,
    });
    expect(result.success).toBe(true);
  });

  it("should use default values", () => {
    const result = templateCreateSchema.safeParse({
      name: "Custom Template",
      content: "Content",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(false);
    }
  });

  it("should reject empty name", () => {
    const result = templateCreateSchema.safeParse({
      name: "",
      content: "Content",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty content", () => {
    const result = templateCreateSchema.safeParse({
      name: "Template",
      content: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("activityQuerySchema", () => {
  it("should validate valid query", () => {
    const result = activityQuerySchema.safeParse({
      departmentId: "550e8400-e29b-41d4-a716-446655440000",
      limit: 25,
      offset: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should use default values", () => {
    const result = activityQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
    }
  });

  it("should clamp limit to max 100", () => {
    const result = activityQuerySchema.safeParse({
      limit: 200,
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkDepartmentReorderSchema", () => {
  it("should validate valid reorder", () => {
    const result = bulkDepartmentReorderSchema.safeParse({
      departments: [
        { id: "550e8400-e29b-41d4-a716-446655440000", sortOrder: 0 },
        { id: "550e8400-e29b-41d4-a716-446655440001", sortOrder: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty departments array", () => {
    const result = bulkDepartmentReorderSchema.safeParse({
      departments: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID", () => {
    const result = bulkDepartmentReorderSchema.safeParse({
      departments: [{ id: "invalid", sortOrder: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("initializeDepartmentsSchema", () => {
  it("should validate valid initialization", () => {
    const result = initializeDepartmentsSchema.safeParse({
      departmentTypes: ["lighting", "costuming", "props"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty array", () => {
    const result = initializeDepartmentsSchema.safeParse({
      departmentTypes: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid department type", () => {
    const result = initializeDepartmentsSchema.safeParse({
      departmentTypes: ["invalid_type"],
    });
    expect(result.success).toBe(false);
  });
});
