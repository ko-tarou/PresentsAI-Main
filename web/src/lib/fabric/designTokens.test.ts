import { describe, it, expect, beforeEach } from "vitest";
import { DesignTokenStore, globalTokens } from "./designTokens";

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe("DesignTokenStore", () => {
  let store: DesignTokenStore;

  beforeEach(() => {
    store = new DesignTokenStore();
  });

  it("has a non-empty default colors array with valid shape", () => {
    expect(store.colors.length).toBeGreaterThan(0);
    for (const c of store.colors) {
      expect(typeof c.id).toBe("string");
      expect(typeof c.name).toBe("string");
      expect(typeof c.value).toBe("string");
    }
  });

  it("default color hex values match the hex pattern", () => {
    for (const c of store.colors) {
      expect(c.value).toMatch(HEX);
    }
  });

  it("has a non-empty default textStyles array with valid shape", () => {
    expect(store.textStyles.length).toBeGreaterThan(0);
    for (const s of store.textStyles) {
      expect(typeof s.fontSize).toBe("number");
      expect(typeof s.fontFamily).toBe("string");
      expect(typeof s.fontWeight).toBe("string");
      expect(typeof s.fill).toBe("string");
    }
  });

  it("addColor appends a color with a generated id", () => {
    const before = store.colors.length;
    store.addColor("Brand", "#abcdef");
    expect(store.colors.length).toBe(before + 1);
    const added = store.colors[store.colors.length - 1];
    expect(added.name).toBe("Brand");
    expect(added.value).toBe("#abcdef");
    expect(added.id.length).toBeGreaterThan(0);
    expect(added.id).toMatch(/^color-/);
  });

  it("addTextStyle appends a text style with a generated id", () => {
    const before = store.textStyles.length;
    store.addTextStyle({
      name: "Custom",
      fontSize: 24,
      fontFamily: "serif",
      fontWeight: "bold",
      fill: "#123456",
    });
    expect(store.textStyles.length).toBe(before + 1);
    const added = store.textStyles[store.textStyles.length - 1];
    expect(added.name).toBe("Custom");
    expect(added.fontSize).toBe(24);
    expect(added.id).toMatch(/^text-/);
  });

  it("globalTokens is a DesignTokenStore instance", () => {
    expect(globalTokens).toBeInstanceOf(DesignTokenStore);
    expect(globalTokens.colors.length).toBeGreaterThan(0);
  });
});
