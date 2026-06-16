"use client";
import { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { extractSlideText, generateSpeakerNotes } from "@lib/ai/speakerNotes";

export function SpeakerNotesPanel() {
  const { activeSlideId, presentationId, canvas } = useEditorStore();
  const { slides, updateSlide } = useSlideStore();
  const { accessToken } = useAuthStore();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(false);

  const currentSlide = slides.find(s => s.id === activeSlideId);

  useEffect(() => {
    setNotes(currentSlide?.notes ?? "");
    setGenError(false);
  }, [activeSlideId, currentSlide]);

  const saveNotes = useCallback(async () => {
    if (!accessToken || !presentationId || !activeSlideId) return;
    setSaving(true);
    try {
      await slidesApi.updateNotes(accessToken, presentationId, activeSlideId, notes);
      updateSlide(activeSlideId, { notes });
    } finally {
      setSaving(false);
    }
  }, [accessToken, presentationId, activeSlideId, notes, updateSlide]);

  // AI 第一弾(案A): 現在のスライドのテキストから発表ノートを生成して差し込む。
  // LFM2 Gateway 経由(@lib/ai/speakerNotes)。生成結果は textarea に入るので
  // ユーザーが編集し、blur で永続化される(自動保存はしない)。
  const generate = useCallback(async () => {
    setGenError(false);
    setGenerating(true);
    try {
      const text = extractSlideText(canvas);
      const generated = await generateSpeakerNotes(text);
      if (generated) setNotes(generated);
    } catch {
      setGenError(true);
    } finally {
      setGenerating(false);
    }
  }, [canvas]);

  if (!activeSlideId) return null;

  return (
    <div className="border-t p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-500">スピーカーノート</p>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-gray-400">保存中...</span>}
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            title="スライドのテキストから発表ノートを自動生成"
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className={`h-3 w-3 ${generating ? "animate-pulse" : ""}`} />
            {generating ? "生成中..." : "AI生成"}
          </button>
        </div>
      </div>
      {genError && (
        <p className="mb-1 text-[11px] text-red-500">
          AI サービスに接続できませんでした。
        </p>
      )}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        onBlur={saveNotes}
        placeholder="発表用のメモを入力..."
        className="w-full h-24 rounded-lg border p-2 text-xs resize-none focus:border-blue-400 focus:outline-none text-gray-700"
      />
    </div>
  );
}
