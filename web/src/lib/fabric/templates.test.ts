import { describe, it, expect } from "vitest";
import { BUILT_IN_TEMPLATES } from "./templates";

describe("BUILT_IN_TEMPLATES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(BUILT_IN_TEMPLATES)).toBe(true);
    expect(BUILT_IN_TEMPLATES.length).toBeGreaterThan(0);
  });

  it("every template has id, name, thumbnail, and content", () => {
    for (const t of BUILT_IN_TEMPLATES) {
      expect(typeof t.id).toBe("string");
      expect(t.id.length).toBeGreaterThan(0);
      expect(typeof t.name).toBe("string");
      expect(t.name.length).toBeGreaterThan(0);
      expect(typeof t.thumbnail).toBe("string");
      expect(t.thumbnail.length).toBeGreaterThan(0);
      expect(t.content).toBeDefined();
    }
  });

  it("every template content has version and an objects array", () => {
    for (const t of BUILT_IN_TEMPLATES) {
      expect(typeof t.content.version).toBe("string");
      expect(Array.isArray(t.content.objects)).toBe(true);
    }
  });

  it("ids are unique", () => {
    const ids = BUILT_IN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("the blank template exists and has an empty objects array", () => {
    const blank = BUILT_IN_TEMPLATES.find((t) => t.id === "blank");
    expect(blank).toBeDefined();
    expect(blank!.content.objects).toEqual([]);
  });

  it("non-blank templates have at least one object", () => {
    const nonBlank = BUILT_IN_TEMPLATES.filter((t) => t.id !== "blank");
    expect(nonBlank.length).toBeGreaterThan(0);
    for (const t of nonBlank) {
      expect(t.content.objects.length).toBeGreaterThan(0);
    }
  });
});
