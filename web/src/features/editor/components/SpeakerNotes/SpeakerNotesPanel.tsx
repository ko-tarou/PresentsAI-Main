"use client";
import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";

export function SpeakerNotesPanel() {
  const { activeSlideId, presentationId } = useEditorStore();
  const { slides, updateSlide } = useSlideStore();
  const { accessToken } = useAuthStore();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const currentSlide = slides.find(s => s.id === activeSlideId);

  useEffect(() => {
    setNotes(currentSlide?.notes ?? "");
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

  if (!activeSlideId) return null;

  return (
    <div className="border-t p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-500">スピーカーノート</p>
        {saving && <span className="text-xs text-gray-400">保存中...</span>}
      </div>
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
