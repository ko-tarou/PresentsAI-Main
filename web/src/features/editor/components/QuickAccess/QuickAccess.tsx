"use client";
import { Undo2, Redo2, Save } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useHistory } from "../../hooks/useHistory";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { toJSON } from "@lib/fabric/canvas";
import type { SlideContent } from "@shared/types/slide";

// PowerPoint-style Quick Access Toolbar: Undo / Redo / Save.
export function QuickAccess() {
  const { canvas, activeSlideId, presentationId, isDirty, setDirty } = useEditorStore();
  const { undo, redo } = useHistory();
  const { accessToken } = useAuthStore();

  async function handleSave() {
    if (!canvas || !accessToken || !presentationId || !activeSlideId) return;
    const content = toJSON(canvas) as unknown as SlideContent;
    await slidesApi.updateContent(accessToken, presentationId, activeSlideId, content);
    setDirty(false);
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={undo}
        title="元に戻す (⌘Z)"
        disabled={!canvas}
        className="flex h-7 w-7 items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        onClick={redo}
        title="やり直し (⌘⇧Z)"
        disabled={!canvas}
        className="flex h-7 w-7 items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <Redo2 className="h-4 w-4" />
      </button>
      <button
        onClick={handleSave}
        title={isDirty ? "上書き保存 (⌘S)" : "保存済み"}
        disabled={!canvas}
        className={`flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${
          isDirty
            ? "text-primary-700 hover:bg-primary-100"
            : "text-content-tertiary hover:bg-surface-muted"
        }`}
      >
        <Save className="h-3.5 w-3.5" />
        {isDirty ? "上書き保存" : "保存済み"}
      </button>
    </div>
  );
}
