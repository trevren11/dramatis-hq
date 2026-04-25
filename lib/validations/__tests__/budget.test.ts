import { describe, it, expect } from "vitest";
import {
  budgetCreateSchema,
  budgetUpdateSchema,
  budgetLineCreateSchema,
  budgetLineUpdateSchema,
  budgetLineBulkCreateSchema,
  budgetLineReorderSchema,
  budgetReportQuerySchema,
  exportFormatSchema,
  initializeBudgetSchema,
} from "../budget";

describe("Budget Validation", () => {
  describe("budgetCreateSchema", () => {
    it("accepts valid budget data", () => {
      const result = budgetCreateSchema.safeParse({
        name: "Spring Production Budget",
        description: "Budget for spring 2024 production",
        totalAmount: 10000,
      });
      expect(result.success).toBe(true);
    });

    it("requires budget name", () => {
      const result = budgetCreateSchema.safeParse({ name: "", totalAmount: 5000 });
      expect(result.success).toBe(false);
    });

    it("enforces max name length", () => {
      const result = budgetCreateSchema.safeParse({ name: "x".repeat(256), totalAmount: 5000 });
      expect(result.success).toBe(false);
    });

    it("enforces max description length", () => {
      const result = budgetCreateSchema.safeParse({ name: "Test", description: "x".repeat(2001) });
      expect(result.success).toBe(false);
    });

    it("rejects negative total amount", () => {
      const result = budgetCreateSchema.safeParse({ name: "Test Budget", totalAmount: -100 });
      expect(result.success).toBe(false);
    });

    it("accepts fiscal year dates", () => {
      const result = budgetCreateSchema.safeParse({
        name: "Annual Budget",
        fiscalYearStart: new Date("2024-01-01"),
        fiscalYearEnd: new Date("2024-12-31"),
      });
      expect(result.success).toBe(true);
    });

    it("allows optional fields to be null", () => {
      const result = budgetCreateSchema.safeParse({
        name: "Minimal Budget",
        description: null,
        fiscalYearStart: null,
        fiscalYearEnd: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("budgetUpdateSchema", () => {
    it("allows partial updates", () => {
      const result = budgetUpdateSchema.safeParse({ name: "Updated Budget Name" });
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      expect(budgetUpdateSchema.safeParse({}).success).toBe(true);
    });
  });

  describe("budgetLineCreateSchema", () => {
    it("accepts valid budget line data", () => {
      const result = budgetLineCreateSchema.safeParse({
        category: "scenic",
        budgetedAmount: 2500,
        description: "Set construction materials",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all budget categories", () => {
      const categories = [
        "scenic",
        "costumes",
        "props",
        "lighting",
        "sound",
        "marketing",
        "venue",
        "royalties",
        "miscellaneous",
      ] as const;
      for (const category of categories) {
        expect(budgetLineCreateSchema.safeParse({ category, budgetedAmount: 1000 }).success).toBe(
          true
        );
      }
    });

    it("rejects invalid category", () => {
      const result = budgetLineCreateSchema.safeParse({
        category: "invalid_category",
        budgetedAmount: 1000,
      });
      expect(result.success).toBe(false);
    });

    it("enforces max custom category name length", () => {
      const result = budgetLineCreateSchema.safeParse({
        category: "miscellaneous",
        customCategoryName: "x".repeat(101),
        budgetedAmount: 500,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative budgeted amount", () => {
      const result = budgetLineCreateSchema.safeParse({
        category: "costumes",
        budgetedAmount: -500,
      });
      expect(result.success).toBe(false);
    });

    it("applies default values", () => {
      const result = budgetLineCreateSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe("miscellaneous");
        expect(result.data.budgetedAmount).toBe(0);
        expect(result.data.sortOrder).toBe(0);
        expect(result.data.isActive).toBe(true);
      }
    });
  });

  describe("budgetLineUpdateSchema", () => {
    it("allows partial updates", () => {
      expect(budgetLineUpdateSchema.safeParse({ budgetedAmount: 3000 }).success).toBe(true);
    });
  });

  describe("budgetLineBulkCreateSchema", () => {
    it("accepts valid bulk create data", () => {
      const result = budgetLineBulkCreateSchema.safeParse({
        lines: [
          { category: "scenic", budgetedAmount: 2000 },
          { category: "costumes", budgetedAmount: 1500 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("requires at least one line", () => {
      expect(budgetLineBulkCreateSchema.safeParse({ lines: [] }).success).toBe(false);
    });

    it("limits to 50 lines", () => {
      const lines = Array(51)
        .fill(null)
        .map(() => ({ category: "miscellaneous" as const, budgetedAmount: 100 }));
      expect(budgetLineBulkCreateSchema.safeParse({ lines }).success).toBe(false);
    });
  });

  describe("budgetLineReorderSchema", () => {
    it("accepts valid reorder data", () => {
      const result = budgetLineReorderSchema.safeParse({
        lines: [
          { id: "550e8400-e29b-41d4-a716-446655440000", sortOrder: 0 },
          { id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", sortOrder: 1 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("requires valid UUID for line id", () => {
      expect(
        budgetLineReorderSchema.safeParse({ lines: [{ id: "invalid-id", sortOrder: 0 }] }).success
      ).toBe(false);
    });

    it("requires at least one line", () => {
      expect(budgetLineReorderSchema.safeParse({ lines: [] }).success).toBe(false);
    });
  });

  describe("budgetReportQuerySchema", () => {
    it("accepts valid report query", () => {
      const result = budgetReportQuerySchema.safeParse({
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        category: "costumes",
        groupBy: "category",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all groupBy options", () => {
      for (const groupBy of ["category", "date", "vendor"] as const) {
        expect(budgetReportQuerySchema.safeParse({ groupBy }).success).toBe(true);
      }
    });

    it("applies default groupBy", () => {
      const result = budgetReportQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupBy).toBe("category");
      }
    });
  });

  describe("exportFormatSchema", () => {
    it("accepts csv and pdf formats", () => {
      expect(exportFormatSchema.safeParse({ format: "csv" }).success).toBe(true);
      expect(exportFormatSchema.safeParse({ format: "pdf" }).success).toBe(true);
    });

    it("rejects invalid format", () => {
      expect(exportFormatSchema.safeParse({ format: "xlsx" }).success).toBe(false);
    });

    it("applies default format", () => {
      const result = exportFormatSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe("csv");
      }
    });
  });

  describe("initializeBudgetSchema", () => {
    it("accepts valid initialization data", () => {
      const result = initializeBudgetSchema.safeParse({
        name: "2024 Production Budget",
        categories: ["scenic", "costumes", "props"],
        totalAmount: 15000,
      });
      expect(result.success).toBe(true);
    });

    it("applies default name and amount", () => {
      const result = initializeBudgetSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Production Budget");
        expect(result.data.totalAmount).toBe(0);
      }
    });

    it("rejects invalid categories", () => {
      expect(
        initializeBudgetSchema.safeParse({ categories: ["scenic", "invalid_category"] }).success
      ).toBe(false);
    });

    it("rejects negative total amount", () => {
      expect(initializeBudgetSchema.safeParse({ totalAmount: -1000 }).success).toBe(false);
    });
  });
});
