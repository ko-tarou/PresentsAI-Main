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
