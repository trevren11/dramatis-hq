import { describe, it, expect } from "vitest";
import { validateResponsesAgainstForm, type FormField } from "../form-builder";

describe("validateResponsesAgainstForm", () => {
  const sampleFields: FormField[] = [
    { id: "name", type: "text", label: "Name", required: true },
    { id: "bio", type: "textarea", label: "Bio", required: false },
    { id: "age18", type: "boolean", label: "Are you 18+?", required: true },
    { id: "role", type: "select", label: "Role", required: true, options: ["Lead", "Ensemble"] },
    {
      id: "skills",
      type: "multiselect",
      label: "Skills",
      required: false,
      options: ["Singing", "Dancing", "Acting"],
    },
    { id: "dob", type: "date", label: "Date of Birth", required: false },
  ];

  it("validates complete valid responses", () => {
    const responses = {
      name: "John Doe",
      bio: "Actor",
      age18: true,
      role: "Lead",
      skills: ["Singing", "Dancing"],
      dob: "1990-01-15",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates minimal required responses", () => {
    const responses = {
      name: "John",
      age18: true,
      role: "Lead",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(true);
  });

  it("fails when required text field is missing", () => {
    const responses = {
      age18: true,
      role: "Lead",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required");
  });

  it("fails when required text field is empty string", () => {
    const responses = {
      name: "",
      age18: true,
      role: "Lead",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required");
  });

  it("fails when required boolean field is missing", () => {
    const responses = {
      name: "John",
      role: "Lead",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Are you 18+? is required");
  });

  it("fails when required select field has invalid option", () => {
    const responses = {
      name: "John",
      age18: true,
      role: "Invalid",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Role has an invalid option");
  });

  it("fails when multiselect has invalid options", () => {
    const responses = {
      name: "John",
      age18: true,
      role: "Lead",
      skills: ["Singing", "Flying"],
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Skills has invalid options");
  });

  it("fails when date field has invalid format", () => {
    const responses = {
      name: "John",
      age18: true,
      role: "Lead",
      dob: "01/15/1990",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Date of Birth must be a valid date (YYYY-MM-DD)");
  });

  it("fails when boolean field receives non-boolean", () => {
    const responses = {
      name: "John",
      age18: "yes",
      role: "Lead",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Are you 18+? must be a boolean");
  });

  it("fails when text field receives non-string", () => {
    const responses = {
      name: 123,
      age18: true,
      role: "Lead",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name must be a string");
  });

  it("fails when select field receives non-string", () => {
    const responses = {
      name: "John",
      age18: true,
      role: ["Lead"],
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Role must be a string");
  });

  it("fails when multiselect field receives non-array", () => {
    const responses = {
      name: "John",
      age18: true,
      role: "Lead",
      skills: "Singing",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Skills must be an array");
  });

  it("skips validation for empty optional fields", () => {
    const responses = {
      name: "John",
      age18: true,
      role: "Lead",
      bio: "",
      skills: [],
      dob: null,
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(true);
  });

  it("collects multiple errors", () => {
    const responses = {
      name: "",
      age18: "yes",
      role: "Invalid",
    };

    const result = validateResponsesAgainstForm(responses, sampleFields);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty fields array", () => {
    const responses = { name: "John" };
    const result = validateResponsesAgainstForm(responses, []);
    expect(result.valid).toBe(true);
  });

  it("handles empty responses object", () => {
    const optionalFields: FormField[] = [
      { id: "bio", type: "textarea", label: "Bio", required: false },
    ];

    const result = validateResponsesAgainstForm({}, optionalFields);
    expect(result.valid).toBe(true);
  });
});
