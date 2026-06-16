// AI speaker-notes generation (LFM AI 第一弾・案A). Reuses the in-app LFM2
// gateway path (generateText -> /api/ai/chat -> LFM Gateway) and the same
// canvas text-extraction used by proofreading, so the browser never sees the
// gateway URL and the streaming plumbing is shared.
import { generateText } from "./client";

// Re-exported so the UI has a single import surface for the notes feature.
export { extractSlideText } from "./proofread";

const SYSTEM_PROMPT =
  "あなたはプレゼンテーションの発表を支援するアシスタントです。" +
  "スライド上のテキストを読み取り、発表者がそのまま読み上げられる" +
  "自然な話し言葉のスピーカーノート（発表原稿）を日本語で作成します。" +
  "箇条書きではなく、つながりのある説明文で、簡潔に。";

/**
 * Builds the user prompt that asks the model to turn the slide's text into a
 * spoken-style speaker note. Kept separate so it can be unit-tested without the
 * network.
 */
export function buildSpeakerNotesPrompt(slideText: string): string {
  return (
    "次のスライドに記載されたテキストをもとに、発表者が読み上げるための" +
    "スピーカーノート（発表原稿）を作成してください。" +
    "聴衆に語りかける自然な話し言葉で、3〜5文程度にまとめてください。" +
    "スライドにない事実を創作しないでください。\n\n" +
    "---\n" +
    slideText +
    "\n---"
  );
}

/**
 * Normalizes the model's raw text into a clean speaker note: trims surrounding
 * whitespace, strips an accidental leading label ("スピーカーノート:" /
 * "ノート:" / "原稿:"), and collapses 3+ blank lines. Returns "" for empty input.
 */
export function normalizeNote(raw: string): string {
  let s = (raw ?? "").trim();
  if (!s) return "";
  // Drop a leading "スピーカーノート:" / "ノート:" / "原稿:" label the model
  // sometimes prepends, with optional surrounding spaces.
  s = s.replace(/^(?:スピーカーノート|ノート|原稿|Speaker Notes?)\s*[:：]\s*/i, "");
  // Collapse runs of 3+ newlines down to a single blank line.
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

/**
 * Runs a full speaker-notes pass: prompt -> LFM2 -> normalize. Returns "" for
 * blank input without calling the AI. Throws if the AI request fails so the UI
 * can surface an error state (mirrors proofreadText).
 */
export async function generateSpeakerNotes(slideText: string): Promise<string> {
  const trimmed = (slideText ?? "").trim();
  if (!trimmed) return "";
  const raw = await generateText(buildSpeakerNotesPrompt(trimmed), SYSTEM_PROMPT);
  return normalizeNote(raw);
}
