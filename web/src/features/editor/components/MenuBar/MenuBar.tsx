"use client";
import { useCallback } from "react";
import {
  Undo2, Redo2, MousePointer2, Type, Pen,
  Copy, Trash2,
  BringToFront, SendToBack,
  Save,
} from "lucide-react";
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

interface ToolButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function ToolButton({ active, onClick, title, children }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-primary-100 text-primary-700"
          : "text-content-secondary hover:bg-surface-muted hover:text-content-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />;
}

export function MenuBar() {
  const { canvas, activeTool, setActiveTool, activeSlideId, presentationId, isDirty, setDirty } = useEditorStore();
  const { undo, redo } = useHistory();
  const { accessToken } = useAuthStore();
  usePenTool();
  useKeyboardShortcuts();

  const setTool = useCallback((tool: EditorTool) => {
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
    <div className="flex items-center gap-1 border-b border-border bg-surface px-3 py-1.5 shrink-0 overflow-x-auto">
      {/* Undo/Redo */}
      <ToolButton onClick={undo} title="元に戻す (⌘Z)"><Undo2 className="h-4 w-4" /></ToolButton>
      <ToolButton onClick={redo} title="やり直し (⌘⇧Z)"><Redo2 className="h-4 w-4" /></ToolButton>
      <Divider />

      {/* Selection tools */}
      <ToolButton active={activeTool === "select"} onClick={() => setTool("select")} title="選択 (V)">
        <MousePointer2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={activeTool === "text"} onClick={() => setTool("text")} title="テキスト (T)">
        <Type className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={activeTool === "pen"} onClick={() => setTool("pen")} title="ペン (P)">
        <Pen className="h-4 w-4" />
      </ToolButton>
      <Divider />

      {/* Insert */}
      <ShapeToolbar />
      <ImageUploadButton />
      <ChartButton />
      <TableButton />
      <Divider />

      {/* Templates / Components */}
      <TemplatePanel />
      <ComponentPanel />
      <Divider />

      {/* Object operations */}
      <ToolButton onClick={() => canvas && duplicateSelected(canvas)} title="複製 (⌘D)"><Copy className="h-4 w-4" /></ToolButton>
      <ToolButton onClick={() => canvas && deleteSelected(canvas)} title="削除 (Del)"><Trash2 className="h-4 w-4" /></ToolButton>
      <ToolButton onClick={() => canvas && bringToFront(canvas)} title="最前面 (⌘])"><BringToFront className="h-4 w-4" /></ToolButton>
      <ToolButton onClick={() => canvas && sendToBack(canvas)} title="最背面 (⌘[)"><SendToBack className="h-4 w-4" /></ToolButton>
      <AutoLayoutButton />
      <Divider />

      {/* View */}
      <ViewOptions />
      <ZoomControls />

      <div className="flex-1 min-w-4" />

      {/* Export */}
      <ExportButton />

      {/* Save */}
      <button
        onClick={handleSave}
        title="保存 (⌘S)"
        className={`ml-1 flex items-center gap-1.5 rounded-lg px-3 h-8 text-sm font-medium transition-colors ${
          isDirty
            ? "bg-[#C43E1C] text-white hover:bg-[#A33216] shadow-sm"
            : "bg-surface-muted text-content-tertiary cursor-default"
        }`}
      >
        <Save className="h-3.5 w-3.5" />
        {isDirty ? "保存" : "保存済み"}
      </button>
    </div>
  );
}
