"use client";
import { useCallback } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useHistory } from "../../hooks/useHistory";
import { usePenTool } from "../../hooks/usePenTool";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { deleteSelected, duplicateSelected, bringToFront, sendToBack } from "@lib/fabric/tools/select";
import { addText } from "@lib/fabric/tools/text";
import { addShape } from "@lib/fabric/tools/shapes";
import { ImageUploadButton } from "../Toolbar/ImageUploadButton";
import { ShapeToolbar } from "../Toolbar/ShapeToolbar";
import { ChartButton } from "../Toolbar/ChartButton";
import { TableButton } from "../Toolbar/TableButton";
import { TemplatePanel } from "../Toolbar/TemplatePanel";
import { ComponentPanel } from "../Toolbar/ComponentPanel";
import { ExportButton } from "../Toolbar/ExportButton";
import { ViewOptions } from "../Toolbar/ViewOptions";
import { AutoLayoutButton } from "../Toolbar/AutoLayoutButton";
import { ZoomControls } from "../Toolbar/ZoomControls";
import type { EditorTool } from "@shared/types/slide";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { toJSON } from "@lib/fabric/canvas";
import type { SlideContent } from "@shared/types/slide";

export function MenuBar() {
  const { canvas, activeTool, setActiveTool, activeSlideId, presentationId, isDirty, setDirty } = useEditorStore();
  const { undo, redo } = useHistory();
  const { accessToken } = useAuthStore();
  usePenTool();
  useKeyboardShortcuts();

  const handleToolClick = useCallback((tool: EditorTool) => {
    setActiveTool(tool);
    if (!canvas) return;
    if (tool === "text") addText(canvas);
    if (tool === "rect") addShape(canvas, "rect");
    if (tool === "circle") addShape(canvas, "circle");
  }, [canvas, setActiveTool]);

  async function handleSave() {
    if (!canvas || !accessToken || !presentationId || !activeSlideId) return;
    const content = toJSON(canvas) as unknown as SlideContent;
    await slidesApi.updateContent(accessToken, presentationId, activeSlideId, content);
    setDirty(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-white px-2 py-1 min-h-10 shrink-0">
      {/* Undo / Redo */}
      <button onClick={undo} title="元に戻す (⌘Z)" className="rounded p-1.5 text-sm hover:bg-gray-100">↩</button>
      <button onClick={redo} title="やり直し (⌘Y)" className="rounded p-1.5 text-sm hover:bg-gray-100">↪</button>
      <div className="mx-1 h-5 w-px bg-gray-200" />

      {/* Basic tools */}
      {([
        { tool: "select" as EditorTool, emoji: "🖱️", label: "選択 (V)" },
        { tool: "text"   as EditorTool, emoji: "T",   label: "テキスト (T)" },
        { tool: "pen"    as EditorTool, emoji: "✏️",  label: "ペン (P)" },
      ]).map(({ tool, emoji, label }) => (
        <button
          key={tool}
          onClick={() => handleToolClick(tool)}
          title={label}
          className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
            activeTool === tool ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {emoji}
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-gray-200" />

      {/* Shape / media inserts */}
      <ShapeToolbar />
      <ImageUploadButton />
      <ChartButton />
      <TableButton />

      <div className="mx-1 h-5 w-px bg-gray-200" />

      {/* Templates / Components */}
      <TemplatePanel />
      <ComponentPanel />

      <div className="mx-1 h-5 w-px bg-gray-200" />

      {/* Object actions */}
      <button onClick={() => canvas && duplicateSelected(canvas)} title="複製 (⌘D)" className="rounded p-1.5 text-sm hover:bg-gray-100">📋</button>
      <button onClick={() => canvas && deleteSelected(canvas)} title="削除 (Del)" className="rounded p-1.5 text-sm hover:bg-gray-100">🗑️</button>
      <button onClick={() => canvas && bringToFront(canvas)} title="最前面へ (⌘])" className="rounded p-1.5 text-sm hover:bg-gray-100">⬆</button>
      <button onClick={() => canvas && sendToBack(canvas)} title="最背面へ (⌘[)" className="rounded p-1.5 text-sm hover:bg-gray-100">⬇</button>
      <AutoLayoutButton />

      <div className="mx-1 h-5 w-px bg-gray-200" />

      {/* View */}
      <ViewOptions />
      <ZoomControls />

      <div className="flex-1" />

      {/* Export + Save */}
      <ExportButton />
      <button
        onClick={handleSave}
        className={`ml-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
          isDirty ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400 cursor-default"
        }`}
      >
        {isDirty ? "保存" : "保存済み"}
      </button>
    </div>
  );
}
