"use client";
import { useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";
import { deleteSelected, duplicateSelected, bringToFront, sendToBack } from "@lib/fabric/tools/select";
import type { EditorTool } from "@shared/types/slide";

export function useKeyboardShortcuts() {
  const { canvas, setActiveTool } = useEditorStore();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // Suppress shortcuts while editing text inside the canvas (IText/Textbox).
      const editing = canvas
        ?.getObjects()
        .some((o) => (o as { isEditing?: boolean }).isEditing);
      if (editing) return;

      // Behavior 4 — arrow-key nudge. PowerPoint: an arrow moves one grid step
      // (~10px); Ctrl/Cmd+arrow performs a fine 1px nudge.
      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      if (arrows[e.key]) {
        e.preventDefault();
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (!active) return;
        const step = mod ? 1 : 10;
        const [dx, dy] = arrows[e.key];
        active.set({
          left: (active.left ?? 0) + dx * step,
          top: (active.top ?? 0) + dy * step,
        });
        active.setCoords();
        canvas.fire("object:modified", { target: active });
        canvas.requestRenderAll();
        return;
      }

      // Tool shortcuts (no modifier)
      if (!mod) {
        const toolMap: Partial<Record<string, EditorTool>> = {
          v: "select", t: "text", r: "rect", c: "circle", p: "pen", i: "image",
        };
        if (toolMap[e.key]) {
          e.preventDefault();
          setActiveTool(toolMap[e.key]!);
        }
      }

      // Modifier shortcuts
      if (mod) {
        switch (e.key) {
          case "d":
            e.preventDefault();
            if (canvas) duplicateSelected(canvas);
            break;
          case "a":
            e.preventDefault();
            canvas?.getObjects().forEach(o => canvas.setActiveObject(o));
            break;
          case "]":
            e.preventDefault();
            if (canvas) bringToFront(canvas);
            break;
          case "[":
            e.preventDefault();
            if (canvas) sendToBack(canvas);
            break;
        }
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !mod) {
        e.preventDefault();
        if (canvas) deleteSelected(canvas);
      }

      if (e.key === "Escape") {
        canvas?.discardActiveObject();
        canvas?.renderAll();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canvas, setActiveTool]);
}
