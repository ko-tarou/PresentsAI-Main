import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  extractSlideText,
  buildProofreadPrompt,
  normalizeSuggestions,
  proofreadText,
  applySuggestion,
} from "./proofread";

// Mock the AI client so the core logic can be tested without the gateway.
vi.mock("./client", () => ({
  generateJSON: vi.fn(),
}));
import { generateJSON } from "./client";

// Minimal fabric canvas/object stubs. Only the bits proofread.ts touches.
function makeObj(text?: unknown) {
  return {
    text,
    set(key: string, value: unknown) {
      (this as Record<string, unknown>)[key] = value;
    },
  };
}
function makeCanvas(objs: ReturnType<typeof makeObj>[], active: unknown = null) {
  return {
    getObjects: () => objs,
    getActiveObject: () => active,
    requestRenderAll: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("extractSlideText", () => {
  it("returns empty string for null canvas", () => {
    expect(extractSlideText(null)).toBe("");
  });

  it("joins all non-empty text objects, trimming whitespace", () => {
    const canvas = makeCanvas([
      makeObj("  タイトル  "),
      makeObj(""),
      makeObj("   "),
      makeObj("本文です"),
      makeObj(42), // non-string ignored
    ]);
    expect(extractSlideText(canvas)).toBe("タイトル\n本文です");
  });

  it("returns only the active object's text when selectedOnly is true", () => {
    const active = makeObj("選択中のテキスト");
    const canvas = makeCanvas([makeObj("他"), active], active);
    expect(extractSlideText(canvas, true)).toBe("選択中のテキスト");
  });

  it("falls back to all text when selectedOnly but no selection", () => {
    const canvas = makeCanvas([makeObj("a"), makeObj("b")], null);
    expect(extractSlideText(canvas, true)).toBe("a\nb");
  });
});

describe("buildProofreadPrompt", () => {
  it("embeds the source text", () => {
    const p = buildProofreadPrompt("テスト文章");
    expect(p).toContain("テスト文章");
    expect(p).toContain("suggestions");
  });
});

describe("normalizeSuggestions", () => {
  const src = "これはテストの文章です。誤字があるかもしれません。";

  it("returns [] for non-array input", () => {
    expect(normalizeSuggestions({}, src)).toEqual([]);
    expect(normalizeSuggestions({ suggestions: "nope" }, src)).toEqual([]);
    expect(normalizeSuggestions(null, src)).toEqual([]);
  });

  it("keeps valid suggestions whose original exists in source", () => {
    const raw = {
      suggestions: [
        { original: "テスト", suggestion: "検証", reason: "表現改善" },
      ],
    };
    expect(normalizeSuggestions(raw, src)).toEqual([
      { original: "テスト", suggestion: "検証", reason: "表現改善" },
    ]);
  });

  it("defaults a missing reason", () => {
    const raw = { suggestions: [{ original: "テスト", suggestion: "検証" }] };
    expect(normalizeSuggestions(raw, src)[0].reason).toBe("表現改善");
  });

  it("drops empties, no-ops, and originals not found in source", () => {
    const raw = {
      suggestions: [
        { original: "", suggestion: "x", reason: "r" }, // empty original
        { original: "テスト", suggestion: "", reason: "r" }, // empty suggestion
        { original: "同じ", suggestion: "同じ", reason: "r" }, // no-op (not in src anyway)
        { original: "存在しない語", suggestion: "x", reason: "r" }, // not in source
        null,
        "garbage",
      ],
    };
    expect(normalizeSuggestions(raw, src)).toEqual([]);
  });

  it("dedupes identical original/suggestion pairs", () => {
    const raw = {
      suggestions: [
        { original: "文章", suggestion: "文章表現", reason: "a" },
        { original: "文章", suggestion: "文章表現", reason: "b" },
      ],
    };
    expect(normalizeSuggestions(raw, src)).toHaveLength(1);
  });
});

describe("proofreadText", () => {
  beforeEach(() => {
    vi.mocked(generateJSON).mockReset();
  });

  it("returns [] without calling the AI for blank text", async () => {
    expect(await proofreadText("   ")).toEqual([]);
    expect(generateJSON).not.toHaveBeenCalled();
  });

  it("calls generateJSON and normalizes the result", async () => {
    vi.mocked(generateJSON).mockResolvedValue({
      suggestions: [{ original: "ます", suggestion: "です", reason: "誤字" }],
    });
    const result = await proofreadText("これはテストますの文章");
    expect(generateJSON).toHaveBeenCalledOnce();
    expect(result).toEqual([
      { original: "ます", suggestion: "です", reason: "誤字" },
    ]);
  });
});

describe("applySuggestion", () => {
  it("returns false for null canvas", () => {
    expect(
      applySuggestion(null, { original: "a", suggestion: "b", reason: "r" }),
    ).toBe(false);
  });

  it("replaces the first occurrence across text objects and re-renders", () => {
    const obj = makeObj("古い表現があります");
    const canvas = makeCanvas([obj]);
    const ok = applySuggestion(canvas, {
      original: "古い表現",
      suggestion: "新しい表現",
      reason: "表現改善",
    });
    expect(ok).toBe(true);
    expect(obj.text).toBe("新しい表現があります");
    expect(canvas.requestRenderAll).toHaveBeenCalledOnce();
  });

  it("returns false when no object contains the original", () => {
    const canvas = makeCanvas([makeObj("無関係")]);
    expect(
      applySuggestion(canvas, {
        original: "存在しない",
        suggestion: "x",
        reason: "r",
      }),
    ).toBe(false);
  });
});
