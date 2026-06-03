"use client";
import { useEffect, useRef } from "react";
import { PenTool } from "@lib/fabric/tools/pen";
import { useEditorStore } from "../stores/editorStore";

export function usePenTool() {
  const { canvas, activeTool } = useEditorStore();
  const penRef = useRef<PenTool | null>(null);

  useEffect(() => {
    if (!canvas) return;
    if (!penRef.current) penRef.current = new PenTool(canvas);
    if (activeTool === "pen") {
      penRef.current.enable();
    } else {
      penRef.current.disable();
    }
    return () => penRef.current?.disable();
  }, [canvas, activeTool]);
}
