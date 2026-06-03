"use client";
import { useCallback } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useHistory } from "../../hooks/useHistory";
import { deleteSelected, duplicateSelected, bringForward, sendBackward } from "@lib/fabric/tools/select";
import { addText } from "@lib/fabric/tools/text";
import { addShape } from "@lib/fabric/tools/shapes";
import { ImageUploadButton } from "../Toolbar/ImageUploadButton";
import type { EditorTool } from "@shared/types/slide";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { toJSON } from "@lib/fabric/canvas";
import type { SlideContent } from "@shared/types/slide";

const TOOLS: { tool: EditorTool; emoji: string; label: string }[] = [
  { tool: "select", emoji: "🖱️", label: "選択" },
  { tool: "text",   emoji: "T",  label: "テキスト" },
  { tool: "rect",   emoji: "⬜", label: "図形" },
  { tool: "image",  emoji: "🖼️", label: "画像" },
];

export function MenuBar() {
  const { canvas, activeTool, setActiveTool, activeSlideId, presentationId, isDirty, setDirty } = useEditorStore();
  const { undo, redo } = useHistory();
  const { accessToken } = useAuthStore();

  const handleToolClick = useCallback((tool: EditorTool) => {
    setActiveTool(tool);
    if (!canvas) return;
    if (tool === "text") addText(canvas);
    if (tool === "rect") addShape(canvas, "rect");
  }, [canvas, setActiveTool]);

  async function handleSave() {
    if (!canvas || !accessToken || !presentationId || !activeSlideId) return;
    const content = toJSON(canvas) as unknown as SlideContent;
    await slidesApi.updateContent(accessToken, presentationId, activeSlideId, content);
    setDirty(false);
  }

  return (
    <div className="flex items-center gap-1 border-b bg-white px-3 py-1.5">
      {/* Undo / Redo */}
      <button onClick={undo} title="元に戻す (⌘Z)" className="rounded p-1.5 text-sm hover:bg-gray-100">↩</button>
      <button onClick={redo} title="やり直し (⌘Y)" className="rounded p-1.5 text-sm hover:bg-gray-100">↪</button>
      <div className="mx-2 h-4 w-px bg-gray-200" />

      {/* Tool buttons */}
      {TOOLS.map(({ tool, emoji, label }) => (
        <button
          key={tool}
          onClick={() => handleToolClick(tool)}
          title={label}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTool === tool ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {emoji}
        </button>
      ))}
      <ImageUploadButton />
      <div className="mx-2 h-4 w-px bg-gray-200" />

      {/* Object actions */}
      <button onClick={() => canvas && duplicateSelected(canvas)} title="複製" className="rounded p-1.5 text-sm hover:bg-gray-100">📋</button>
      <button onClick={() => canvas && deleteSelected(canvas)} title="削除 (Del)" className="rounded p-1.5 text-sm hover:bg-gray-100">🗑️</button>
      <button onClick={() => canvas && bringForward(canvas)} title="前面へ" className="rounded p-1.5 text-sm hover:bg-gray-100">⬆</button>
      <button onClick={() => canvas && sendBackward(canvas)} title="背面へ" className="rounded p-1.5 text-sm hover:bg-gray-100">⬇</button>

      <div className="flex-1" />

      {/* Save */}
      <button
        onClick={handleSave}
        className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
          isDirty ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400"
        }`}
      >
        {isDirty ? "保存" : "保存済み"}
      </button>
    </div>
  );
}
