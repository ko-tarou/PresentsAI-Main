"use client";
import { useEffect, useRef, useCallback } from "react";
import { HistoryManager } from "@lib/fabric/history";
import { useEditorStore } from "../stores/editorStore";

export function useHistory() {
  const { canvas } = useEditorStore();
  const historyRef = useRef<HistoryManager | null>(null);

  useEffect(() => {
    if (!canvas) return;
    historyRef.current = new HistoryManager(canvas);
  }, [canvas]);

  const undo = useCallback(() => historyRef.current?.undo(), []);
  const redo = useCallback(() => historyRef.current?.redo(), []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = document.activeElement;
        if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;
        canvas?.getActiveObjects().forEach((o) => canvas.remove(o));
        canvas?.discardActiveObject();
        canvas?.renderAll();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canvas, undo, redo]);

  return { undo, redo };
}
