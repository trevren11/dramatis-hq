import { describe, it, expect } from "vitest";
import {
  PREBUILT_QUESTIONS,
  QUESTION_CATEGORIES,
  PROFILE_MAPPINGS,
  PROFILE_MAPPING_OPTIONS,
  getPrebuiltQuestion,
  getQuestionsByCategory,
  generateFieldId,
  createBlankField,
} from "../prebuilt-questions";
import { formFieldSchema } from "@/lib/validations/form-builder";

describe("Prebuilt Questions Library", () => {
  describe("PREBUILT_QUESTIONS", () => {
    it("contains questions array", () => {
      expect(Array.isArray(PREBUILT_QUESTIONS)).toBe(true);
      expect(PREBUILT_QUESTIONS.length).toBeGreaterThan(0);
    });

    it("all questions have valid schema", () => {
      for (const question of PREBUILT_QUESTIONS) {
        const result = formFieldSchema.safeParse(question);
        expect(result.success).toBe(true);
      }
    });

    it("all questions have unique IDs", () => {
      const ids = PREBUILT_QUESTIONS.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("select/multiselect questions have options", () => {
      const selectQuestions = PREBUILT_QUESTIONS.filter(
        (q) => q.type === "select" || q.type === "multiselect"
      );

      for (const question of selectQuestions) {
        expect(question.options).toBeDefined();
        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options?.length).toBeGreaterThan(0);
      }
    });

    it("contains eligibility questions", () => {
      const age18 = PREBUILT_QUESTIONS.find((q) => q.id === "age_18");
      expect(age18).toBeDefined();
      expect(age18?.type).toBe("boolean");
      expect(age18?.required).toBe(true);

      const workAuth = PREBUILT_QUESTIONS.find((q) => q.id === "work_auth");
      expect(workAuth).toBeDefined();
      expect(workAuth?.type).toBe("boolean");
    });

    it("contains role preference questions", () => {
      const rolePreference = PREBUILT_QUESTIONS.find((q) => q.id === "role_preference");
      expect(rolePreference).toBeDefined();
      expect(rolePreference?.type).toBe("textarea");

      const ensembleWilling = PREBUILT_QUESTIONS.find((q) => q.id === "ensemble_willing");
      expect(ensembleWilling).toBeDefined();
      expect(ensembleWilling?.type).toBe("boolean");
    });

    it("contains skill questions", () => {
      const vocalRange = PREBUILT_QUESTIONS.find((q) => q.id === "vocal_range");
      expect(vocalRange).toBeDefined();
      expect(vocalRange?.type).toBe("select");
      expect(vocalRange?.options).toContain("Soprano");
      expect(vocalRange?.options).toContain("Tenor");

      const danceExperience = PREBUILT_QUESTIONS.find((q) => q.id === "dance_experience");
      expect(danceExperience).toBeDefined();
      expect(danceExperience?.type).toBe("multiselect");
      expect(danceExperience?.options).toContain("Ballet");
    });
  });

  describe("QUESTION_CATEGORIES", () => {
    it("is an array of categories", () => {
      expect(Array.isArray(QUESTION_CATEGORIES)).toBe(true);
      expect(QUESTION_CATEGORIES.length).toBeGreaterThan(0);
    });

    it("each category has required properties", () => {
      for (const category of QUESTION_CATEGORIES) {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("label");
        expect(category).toHaveProperty("questionIds");
        expect(typeof category.id).toBe("string");
        expect(typeof category.label).toBe("string");
        expect(Array.isArray(category.questionIds)).toBe(true);
      }
    });

    it("has unique category IDs", () => {
      const ids = QUESTION_CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("all category question IDs reference existing questions", () => {
      const questionIds = new Set(PREBUILT_QUESTIONS.map((q) => q.id));

      for (const category of QUESTION_CATEGORIES) {
        for (const qId of category.questionIds) {
          expect(questionIds.has(qId)).toBe(true);
        }
      }
    });

    it("includes expected categories", () => {
      const categoryIds = QUESTION_CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain("eligibility");
      expect(categoryIds).toContain("logistics");
      expect(categoryIds).toContain("experience");
      expect(categoryIds).toContain("role");
      expect(categoryIds).toContain("skills");
    });
  });

  describe("PROFILE_MAPPINGS", () => {
    it("is an object with string values", () => {
      expect(typeof PROFILE_MAPPINGS).toBe("object");

      for (const [key, value] of Object.entries(PROFILE_MAPPINGS)) {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
      }
    });

    it("contains expected mappings", () => {
      expect(PROFILE_MAPPINGS.name).toBe("talentProfile.stageName");
      expect(PROFILE_MAPPINGS.email).toBe("user.email");
      expect(PROFILE_MAPPINGS.phone).toBe("talentProfile.phone");
    });

    it("all mappings point to valid paths", () => {
      for (const value of Object.values(PROFILE_MAPPINGS)) {
        expect(value).toMatch(/^(talentProfile|user)\./);
      }
    });
  });

  describe("PROFILE_MAPPING_OPTIONS", () => {
    it("is an array of options", () => {
      expect(Array.isArray(PROFILE_MAPPING_OPTIONS)).toBe(true);
      expect(PROFILE_MAPPING_OPTIONS.length).toBeGreaterThan(0);
    });

    it("each option has value and label", () => {
      for (const option of PROFILE_MAPPING_OPTIONS) {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("string");
        expect(typeof option.label).toBe("string");
      }
    });

    it("has unique values", () => {
      const values = PROFILE_MAPPING_OPTIONS.map((o) => o.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("getPrebuiltQuestion", () => {
    it("returns question by ID", () => {
      const question = getPrebuiltQuestion("age_18");
      expect(question).toBeDefined();
      expect(question?.id).toBe("age_18");
      expect(question?.type).toBe("boolean");
    });

    it("returns undefined for non-existent ID", () => {
      const question = getPrebuiltQuestion("non_existent");
      expect(question).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      const question = getPrebuiltQuestion("");
      expect(question).toBeUndefined();
    });

    it("returns correct question with all properties", () => {
      const question = getPrebuiltQuestion("vocal_range");
      expect(question).toBeDefined();
      expect(question?.id).toBe("vocal_range");
      expect(question?.type).toBe("select");
      expect(question?.label).toBe("What is your vocal range?");
      expect(question?.options).toBeDefined();
    });
  });

  describe("getQuestionsByCategory", () => {
    it("returns questions for valid category", () => {
      const questions = getQuestionsByCategory("eligibility");
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);

      const ids = questions.map((q) => q.id);
      expect(ids).toContain("age_18");
      expect(ids).toContain("work_auth");
    });

    it("returns empty array for non-existent category", () => {
      const questions = getQuestionsByCategory("non_existent");
      expect(questions).toEqual([]);
    });

    it("returns empty array for empty string", () => {
      const questions = getQuestionsByCategory("");
      expect(questions).toEqual([]);
    });

    it("returns all questions in skills category", () => {
      const questions = getQuestionsByCategory("skills");
      expect(questions.length).toBeGreaterThan(0);

      const ids = questions.map((q) => q.id);
      expect(ids).toContain("vocal_range");
      expect(ids).toContain("dance_experience");
    });

    it("returns questions in correct order", () => {
      const category = QUESTION_CATEGORIES.find((c) => c.id === "eligibility");
      const questions = getQuestionsByCategory("eligibility");

      expect(questions.map((q) => q.id)).toEqual(category?.questionIds);
    });
  });

  describe("generateFieldId", () => {
    it("generates a string ID", () => {
      const id = generateFieldId();
      expect(typeof id).toBe("string");
    });

    it("generates ID with field_ prefix", () => {
      const id = generateFieldId();
      expect(id.startsWith("field_")).toBe(true);
    });

    it("generates unique IDs", () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        ids.add(generateFieldId());
      }

      expect(ids.size).toBe(100);
    });

    it("generates ID with timestamp and random component", () => {
      const id = generateFieldId();
      const parts = id.split("_");

      expect(parts.length).toBe(3);
      expect(parts[0]).toBe("field");
      expect(parts[1]).toBeDefined();
      expect(parts[2]).toBeDefined();
      if (parts[1] && parts[2]) {
        expect(/^\d+$/.test(parts[1])).toBe(true);
        expect(parts[2].length).toBe(7);
      }
    });
  });

  describe("createBlankField", () => {
    it("creates blank text field", () => {
      const field = createBlankField("text");

      expect(field.type).toBe("text");
      expect(field.label).toBe("");
      expect(field.required).toBe(false);
      expect(field.id).toMatch(/^field_/);
      expect(field.options).toBeUndefined();
    });

    it("creates blank textarea field", () => {
      const field = createBlankField("textarea");

      expect(field.type).toBe("textarea");
      expect(field.label).toBe("");
      expect(field.required).toBe(false);
    });

    it("creates blank boolean field", () => {
      const field = createBlankField("boolean");

      expect(field.type).toBe("boolean");
      expect(field.label).toBe("");
      expect(field.required).toBe(false);
    });

    it("creates blank date field", () => {
      const field = createBlankField("date");

      expect(field.type).toBe("date");
      expect(field.label).toBe("");
      expect(field.required).toBe(false);
    });

    it("creates blank file field", () => {
      const field = createBlankField("file");

      expect(field.type).toBe("file");
      expect(field.label).toBe("");
      expect(field.required).toBe(false);
    });

    it("creates select field with empty options array", () => {
      const field = createBlankField("select");

      expect(field.type).toBe("select");
      expect(field.options).toBeDefined();
      expect(field.options).toEqual([]);
    });

    it("creates multiselect field with empty options array", () => {
      const field = createBlankField("multiselect");

      expect(field.type).toBe("multiselect");
      expect(field.options).toBeDefined();
      expect(field.options).toEqual([]);
    });

    it("generates unique IDs for each field", () => {
      const field1 = createBlankField("text");
      const field2 = createBlankField("text");

      expect(field1.id).not.toBe(field2.id);
    });

    it("created field passes schema validation", () => {
      const field = createBlankField("text");
      field.label = "Test Label";

      const result = formFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });
  });
});
