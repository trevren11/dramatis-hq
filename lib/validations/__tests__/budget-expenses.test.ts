import { describe, it, expect } from "vitest";
import {
  expenseCreateSchema,
  expenseUpdateSchema,
  expenseQuerySchema,
  receiptUploadSchema,
  reimbursementRequestCreateSchema,
  reimbursementRequestUpdateSchema,
  reimbursementReviewSchema,
  reimbursementPaySchema,
  reimbursementQuerySchema,
} from "../budget";

describe("Budget Expenses & Reimbursements Validation", () => {
  describe("expenseCreateSchema", () => {
    it("accepts valid expense data", () => {
      const result = expenseCreateSchema.safeParse({
        budgetLineId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 150.5,
        date: new Date("2024-03-15"),
        vendor: "Hardware Store",
        description: "Paint and brushes",
      });
      expect(result.success).toBe(true);
    });

    it("requires positive amount", () => {
      expect(expenseCreateSchema.safeParse({ amount: 0, date: new Date() }).success).toBe(false);
      expect(expenseCreateSchema.safeParse({ amount: -50, date: new Date() }).success).toBe(false);
    });

    it("requires valid UUID for budgetLineId if provided", () => {
      expect(
        expenseCreateSchema.safeParse({ budgetLineId: "invalid-id", amount: 100, date: new Date() })
          .success
      ).toBe(false);
    });

    it("allows null budgetLineId", () => {
      expect(
        expenseCreateSchema.safeParse({ budgetLineId: null, amount: 100, date: new Date() }).success
      ).toBe(true);
    });

    it("enforces max vendor length", () => {
      expect(
        expenseCreateSchema.safeParse({ amount: 100, date: new Date(), vendor: "x".repeat(256) })
          .success
      ).toBe(false);
    });

    it("enforces max description length", () => {
      expect(
        expenseCreateSchema.safeParse({
          amount: 100,
          date: new Date(),
          description: "x".repeat(2001),
        }).success
      ).toBe(false);
    });

    it("applies default isPaid value", () => {
      const result = expenseCreateSchema.safeParse({ amount: 100, date: new Date() });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPaid).toBe(false);
      }
    });
  });

  describe("expenseUpdateSchema", () => {
    it("allows partial updates", () => {
      expect(
        expenseUpdateSchema.safeParse({ isPaid: true, paymentReference: "CHECK-123" }).success
      ).toBe(true);
    });
  });

  describe("expenseQuerySchema", () => {
    it("accepts valid query parameters", () => {
      const result = expenseQuerySchema.safeParse({
        budgetLineId: "550e8400-e29b-41d4-a716-446655440000",
        category: "scenic",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        isPaid: true,
        limit: 25,
        offset: 0,
      });
      expect(result.success).toBe(true);
    });

    it("applies default limit and offset", () => {
      const result = expenseQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it("enforces max limit", () => {
      expect(expenseQuerySchema.safeParse({ limit: 201 }).success).toBe(false);
    });

    it("coerces isPaid from string", () => {
      const result = expenseQuerySchema.safeParse({ isPaid: "true" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPaid).toBe(true);
      }
    });
  });

  describe("receiptUploadSchema", () => {
    it("accepts valid upload data", () => {
      expect(
        receiptUploadSchema.safeParse({ filename: "receipt.pdf", mimeType: "application/pdf" })
          .success
      ).toBe(true);
    });

    it("requires filename", () => {
      expect(
        receiptUploadSchema.safeParse({ filename: "", mimeType: "application/pdf" }).success
      ).toBe(false);
    });

    it("enforces max filename length", () => {
      expect(
        receiptUploadSchema.safeParse({ filename: "x".repeat(256), mimeType: "application/pdf" })
          .success
      ).toBe(false);
    });

    it("enforces max mimeType length", () => {
      expect(
        receiptUploadSchema.safeParse({ filename: "receipt.pdf", mimeType: "x".repeat(101) })
          .success
      ).toBe(false);
    });
  });

  describe("reimbursementRequestCreateSchema", () => {
    it("accepts valid reimbursement request", () => {
      const result = reimbursementRequestCreateSchema.safeParse({
        expenseId: "550e8400-e29b-41d4-a716-446655440000",
        amountRequested: 75.5,
        justification: "Purchased supplies for set construction",
      });
      expect(result.success).toBe(true);
    });

    it("requires valid expense UUID", () => {
      expect(
        reimbursementRequestCreateSchema.safeParse({ expenseId: "not-a-uuid", amountRequested: 50 })
          .success
      ).toBe(false);
    });

    it("requires positive amount", () => {
      expect(
        reimbursementRequestCreateSchema.safeParse({
          expenseId: "550e8400-e29b-41d4-a716-446655440000",
          amountRequested: 0,
        }).success
      ).toBe(false);
    });

    it("enforces max justification length", () => {
      const result = reimbursementRequestCreateSchema.safeParse({
        expenseId: "550e8400-e29b-41d4-a716-446655440000",
        amountRequested: 50,
        justification: "x".repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("reimbursementRequestUpdateSchema", () => {
    it("allows partial updates", () => {
      expect(reimbursementRequestUpdateSchema.safeParse({ amountRequested: 100 }).success).toBe(
        true
      );
    });

    it("requires positive amount if provided", () => {
      expect(reimbursementRequestUpdateSchema.safeParse({ amountRequested: -50 }).success).toBe(
        false
      );
    });
  });

  describe("reimbursementReviewSchema", () => {
    it("accepts approved status with note", () => {
      expect(
        reimbursementReviewSchema.safeParse({
          status: "approved",
          reviewNote: "Approved for full amount",
        }).success
      ).toBe(true);
    });

    it("accepts denied status with note", () => {
      expect(
        reimbursementReviewSchema.safeParse({
          status: "denied",
          reviewNote: "Missing receipt documentation",
        }).success
      ).toBe(true);
    });

    it("rejects invalid status", () => {
      expect(reimbursementReviewSchema.safeParse({ status: "pending" }).success).toBe(false);
    });

    it("enforces max review note length", () => {
      expect(
        reimbursementReviewSchema.safeParse({ status: "approved", reviewNote: "x".repeat(2001) })
          .success
      ).toBe(false);
    });
  });

  describe("reimbursementPaySchema", () => {
    it("accepts valid payment data", () => {
      expect(reimbursementPaySchema.safeParse({ paymentReference: "CHECK-456" }).success).toBe(
        true
      );
    });

    it("accepts empty object and null payment reference", () => {
      expect(reimbursementPaySchema.safeParse({}).success).toBe(true);
      expect(reimbursementPaySchema.safeParse({ paymentReference: null }).success).toBe(true);
    });

    it("enforces max payment reference length", () => {
      expect(reimbursementPaySchema.safeParse({ paymentReference: "x".repeat(256) }).success).toBe(
        false
      );
    });
  });

  describe("reimbursementQuerySchema", () => {
    it("accepts valid query parameters", () => {
      const result = reimbursementQuerySchema.safeParse({
        status: "pending",
        requestedBy: "550e8400-e29b-41d4-a716-446655440000",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        limit: 25,
        offset: 10,
      });
      expect(result.success).toBe(true);
    });

    it("accepts all reimbursement statuses", () => {
      for (const status of ["pending", "approved", "denied", "paid"] as const) {
        expect(reimbursementQuerySchema.safeParse({ status }).success).toBe(true);
      }
    });

    it("applies default limit and offset", () => {
      const result = reimbursementQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });
  });
});
