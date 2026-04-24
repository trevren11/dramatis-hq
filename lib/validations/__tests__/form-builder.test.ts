import { describe, it, expect } from "vitest";
import {
  formFieldSchema,
  formFieldWithOptionsSchema,
  formBuilderSchema,
  formResponseSchema,
  checkinUpdateSchema,
  checkinSubmitSchema,
} from "../form-builder";

describe("Form Builder Validation", () => {
  describe("formFieldSchema", () => {
    it("accepts valid text field", () => {
      const field = {
        id: "field_1",
        type: "text",
        label: "Your Name",
        required: true,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("accepts valid textarea field with placeholder", () => {
      const field = {
        id: "field_2",
        type: "textarea",
        label: "Tell us about yourself",
        required: false,
        placeholder: "Enter your bio...",
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("accepts valid select field with options", () => {
      const field = {
        id: "field_3",
        type: "select",
        label: "Vocal Range",
        required: true,
        options: ["Soprano", "Alto", "Tenor", "Bass"],
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("accepts valid multiselect field with options", () => {
      const field = {
        id: "field_4",
        type: "multiselect",
        label: "Dance Styles",
        required: false,
        options: ["Ballet", "Jazz", "Tap", "Contemporary"],
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("accepts valid boolean field", () => {
      const field = {
        id: "field_5",
        type: "boolean",
        label: "Are you 18 or older?",
        required: true,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("accepts valid date field", () => {
      const field = {
        id: "field_6",
        type: "date",
        label: "Date of Birth",
        required: false,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("accepts valid file field", () => {
      const field = {
        id: "field_7",
        type: "file",
        label: "Upload Resume",
        required: true,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("accepts field with profileMapping", () => {
      const field = {
        id: "field_8",
        type: "text",
        label: "Stage Name",
        required: false,
        profileMapping: "talentProfile.stageName",
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("rejects field without id", () => {
      const field = {
        type: "text",
        label: "Name",
        required: true,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(false);
    });

    it("rejects field with empty id", () => {
      const field = {
        id: "",
        type: "text",
        label: "Name",
        required: true,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(false);
    });

    it("rejects field without label", () => {
      const field = {
        id: "field_1",
        type: "text",
        required: true,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(false);
    });

    it("rejects field with empty label", () => {
      const field = {
        id: "field_1",
        type: "text",
        label: "",
        required: true,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(false);
    });

    it("rejects field with invalid type", () => {
      const field = {
        id: "field_1",
        type: "invalid",
        label: "Name",
        required: true,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(false);
    });

    it("rejects field with label exceeding 200 characters", () => {
      const field = {
        id: "field_1",
        type: "text",
        label: "A".repeat(201),
        required: true,
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(false);
    });

    it("rejects field with more than 50 options", () => {
      const field = {
        id: "field_1",
        type: "select",
        label: "Select",
        required: true,
        options: Array.from({ length: 51 }, (_, i) => `Option ${String(i + 1)}`),
      };

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(false);
    });
  });

  describe("formFieldWithOptionsSchema", () => {
    it("accepts select field with options", () => {
      const field = {
        id: "field_1",
        type: "select",
        label: "Choice",
        required: true,
        options: ["A", "B", "C"],
      };

      const result = formFieldWithOptionsSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("rejects select field without options", () => {
      const field = {
        id: "field_1",
        type: "select",
        label: "Choice",
        required: true,
      };

      const result = formFieldWithOptionsSchema.safeParse(field);
      expect(result.success).toBe(false);
    });

    it("rejects multiselect field with empty options array", () => {
      const field = {
        id: "field_1",
        type: "multiselect",
        label: "Choices",
        required: true,
        options: [],
      };

      const result = formFieldWithOptionsSchema.safeParse(field);
      expect(result.success).toBe(false);
    });

    it("accepts text field without options", () => {
      const field = {
        id: "field_1",
        type: "text",
        label: "Name",
        required: true,
      };

      const result = formFieldWithOptionsSchema.safeParse(field);
      expect(result.success).toBe(true);
    });
  });

  describe("formBuilderSchema", () => {
    it("accepts valid form with multiple fields", () => {
      const form = {
        fields: [
          { id: "name", type: "text", label: "Name", required: true },
          { id: "age18", type: "boolean", label: "Are you 18+?", required: true },
          {
            id: "role",
            type: "select",
            label: "Role",
            required: false,
            options: ["Lead", "Ensemble"],
          },
        ],
      };

      const result = formBuilderSchema.safeParse(form);
      expect(result.success).toBe(true);
    });

    it("accepts form with empty fields array", () => {
      const form = { fields: [] };

      const result = formBuilderSchema.safeParse(form);
      expect(result.success).toBe(true);
    });

    it("rejects form with duplicate field IDs", () => {
      const form = {
        fields: [
          { id: "name", type: "text", label: "Name", required: true },
          { id: "name", type: "text", label: "Other Name", required: false },
        ],
      };

      const result = formBuilderSchema.safeParse(form);
      expect(result.success).toBe(false);
      if (!result.success && result.error.errors[0]) {
        expect(result.error.errors[0].message).toBe("Field IDs must be unique");
      }
    });

    it("rejects form with more than 50 fields", () => {
      const form = {
        fields: Array.from({ length: 51 }, (_, i) => ({
          id: `field_${String(i)}`,
          type: "text",
          label: `Field ${String(i)}`,
          required: false,
        })),
      };

      const result = formBuilderSchema.safeParse(form);
      expect(result.success).toBe(false);
    });

    it("rejects form with select field missing options", () => {
      const form = {
        fields: [{ id: "choice", type: "select", label: "Choice", required: true }],
      };

      const result = formBuilderSchema.safeParse(form);
      expect(result.success).toBe(false);
      if (!result.success && result.error.errors[0]) {
        expect(result.error.errors[0].message).toBe(
          "Select and multiselect fields must have options"
        );
      }
    });
  });

  describe("formResponseSchema", () => {
    it("accepts valid string responses", () => {
      const response = {
        responses: {
          name: "John Doe",
          bio: "Actor from NYC",
        },
      };

      const result = formResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("accepts array responses for multiselect", () => {
      const response = {
        responses: {
          skills: ["Singing", "Dancing", "Acting"],
        },
      };

      const result = formResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("accepts boolean responses", () => {
      const response = {
        responses: {
          age18: true,
          hasTransport: false,
        },
      };

      const result = formResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("accepts null responses", () => {
      const response = {
        responses: {
          optionalField: null,
        },
      };

      const result = formResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("accepts mixed response types", () => {
      const response = {
        responses: {
          name: "Jane",
          age18: true,
          skills: ["Ballet", "Jazz"],
          notes: null,
        },
      };

      const result = formResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("accepts empty responses object", () => {
      const response = { responses: {} };

      const result = formResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("checkinUpdateSchema", () => {
    it("accepts valid status update", () => {
      const update = {
        status: "in_room",
      };

      const result = checkinUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("accepts status update with queue number", () => {
      const update = {
        status: "checked_in",
        queueNumber: 5,
      };

      const result = checkinUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("accepts all valid status values", () => {
      for (const status of ["checked_in", "in_room", "completed"]) {
        const result = checkinUpdateSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      const update = {
        status: "invalid_status",
      };

      const result = checkinUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("rejects non-positive queue number", () => {
      const update = {
        status: "checked_in",
        queueNumber: 0,
      };

      const result = checkinUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("rejects negative queue number", () => {
      const update = {
        status: "checked_in",
        queueNumber: -1,
      };

      const result = checkinUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });

  describe("checkinSubmitSchema", () => {
    it("accepts valid check-in submission", () => {
      const submission = {
        responses: {
          name: "John Doe",
          age18: true,
        },
      };

      const result = checkinSubmitSchema.safeParse(submission);
      expect(result.success).toBe(true);
    });

    it("accepts empty responses", () => {
      const submission = { responses: {} };

      const result = checkinSubmitSchema.safeParse(submission);
      expect(result.success).toBe(true);
    });
  });
});
