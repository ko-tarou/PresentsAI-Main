import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  buildSpeakerNotesPrompt,
  normalizeNote,
  generateSpeakerNotes,
} from "./speakerNotes";

// Mock the AI client so the core logic is tested without the LFM gateway —
// no real network/server is ever touched.
vi.mock("./client", () => ({
  generateText: vi.fn(),
}));
import { generateText } from "./client";

describe("buildSpeakerNotesPrompt", () => {
  it("embeds the slide text and asks for a spoken-style note", () => {
    const p = buildSpeakerNotesPrompt("売上は前年比120%");
    expect(p).toContain("売上は前年比120%");
    expect(p).toContain("スピーカーノート");
  });
});

describe("normalizeNote", () => {
  it("returns empty string for blank input", () => {
    expect(normalizeNote("")).toBe("");
    expect(normalizeNote("   \n  ")).toBe("");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeNote("  本日はご清聴ありがとうございます。  ")).toBe(
      "本日はご清聴ありがとうございます。",
    );
  });

  it("strips a leading label the model sometimes prepends", () => {
    expect(normalizeNote("スピーカーノート: これは本文です")).toBe("これは本文です");
    expect(normalizeNote("ノート：本文")).toBe("本文");
    expect(normalizeNote("Speaker Notes: hello")).toBe("hello");
  });

  it("collapses 3+ blank lines into a single blank line", () => {
    expect(normalizeNote("一段落目\n\n\n\n二段落目")).toBe("一段落目\n\n二段落目");
  });

  it("leaves a normal note untouched", () => {
    const note = "まず背景を説明します。\n次に結果を示します。";
    expect(normalizeNote(note)).toBe(note);
  });
});

describe("generateSpeakerNotes", () => {
  beforeEach(() => {
    vi.mocked(generateText).mockReset();
  });

  it("returns '' without calling the AI for blank text", async () => {
    expect(await generateSpeakerNotes("   ")).toBe("");
    expect(generateText).not.toHaveBeenCalled();
  });

  it("calls generateText with the prompt + system message and normalizes output", async () => {
    vi.mocked(generateText).mockResolvedValue(
      "スピーカーノート: このスライドでは第1四半期の成果を紹介します。",
    );
    const result = await generateSpeakerNotes("Q1 成果");

    expect(generateText).toHaveBeenCalledOnce();
    const [prompt, system] = vi.mocked(generateText).mock.calls[0];
    expect(prompt).toContain("Q1 成果");
    expect(system).toContain("スピーカーノート");
    // Leading label stripped by normalizeNote.
    expect(result).toBe("このスライドでは第1四半期の成果を紹介します。");
  });

  it("propagates AI errors so the UI can show an error state", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("gateway down"));
    await expect(generateSpeakerNotes("内容")).rejects.toThrow("gateway down");
  });
});
