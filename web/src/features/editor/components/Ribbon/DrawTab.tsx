"use client";
import { useState } from "react";
import { MousePointer2, Pen, Highlighter, Eraser, Square, Circle, Minus } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { enableFreehand, disableFreehand } from "@lib/fabric/tools/freehand";
import { addShape } from "@lib/fabric/tools/shapes";
import { deleteSelected } from "@lib/fabric/tools/select";
import { RibbonGroup, RibbonDivider, RibbonBigButton, RibbonIconButton } from "./ribbonPrimitives";

export function DrawTab() {
  const { canvas, activeTool, setActiveTool } = useEditorStore();
  // Highlighter is a fabric drawing-mode brush, not an EditorTool, so it is
  // tracked locally. It is mutually exclusive with select/pen.
  const [highlighting, setHighlighting] = useState(false);

  function selectTool() {
    if (canvas) disableFreehand(canvas);
    setHighlighting(false);
    setActiveTool("select");
  }

  function penTool() {
    if (canvas) disableFreehand(canvas);
    setHighlighting(false);
    setActiveTool("pen"); // usePenTool() activates pen drawing on activeTool==="pen"
  }

  function toggleHighlighter() {
    if (!canvas) return;
    if (highlighting) {
      disableFreehand(canvas);
      setHighlighting(false);
      return;
    }
    // Leave pen mode so the freehand brush owns the drawing surface.
    setActiveTool("select");
    enableFreehand(canvas, "rgba(255,235,59,0.4)", 18);
    setHighlighting(true);
  }

  function erase() {
    if (!canvas) return;
    if (highlighting) {
      disableFreehand(canvas);
      setHighlighting(false);
    }
    deleteSelected(canvas);
  }

  const penActive = activeTool === "pen" && !highlighting;
  const selectActive = activeTool === "select" && !highlighting;

  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup label="ツール">
        <RibbonBigButton
          icon={<MousePointer2 />} label="選択"
          active={selectActive} onClick={selectTool} disabled={!canvas}
        />
        <RibbonBigButton
          icon={<Pen />} label="ペン"
          active={penActive} onClick={penTool} disabled={!canvas}
        />
        <RibbonBigButton
          icon={<Highlighter />} label={highlighting ? "描画終了" : "蛍光ペン"}
          active={highlighting} onClick={toggleHighlighter} disabled={!canvas}
          title="蛍光ペン — 半透明の太いブラシ"
        />
        <RibbonBigButton
          icon={<Eraser />} label="消しゴム"
          onClick={erase} disabled={!canvas}
          title="選択中のオブジェクトを削除"
        />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="図形">
        <RibbonIconButton
          icon={<Square />} title="四角形"
          onClick={() => canvas && addShape(canvas, "rect")} disabled={!canvas}
        />
        <RibbonIconButton
          icon={<Circle />} title="円"
          onClick={() => canvas && addShape(canvas, "circle")} disabled={!canvas}
        />
        <RibbonIconButton
          icon={<Minus />} title="直線"
          onClick={() => canvas && addShape(canvas, "line")} disabled={!canvas}
        />
      </RibbonGroup>
    </div>
  );
}
