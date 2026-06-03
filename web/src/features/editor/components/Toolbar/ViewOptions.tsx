"use client";
import { useState } from "react";
import { Grid3x3, Magnet } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { toggleGrid, enableSnap } from "@lib/fabric/grid";

export function ViewOptions() {
  const { canvas } = useEditorStore();
  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  function handleGrid() {
    if (!canvas) return;
    const next = !showGrid; setShowGrid(next); toggleGrid(canvas, next);
  }
  function handleSnap() {
    if (!canvas) return;
    const next = !snapEnabled; setSnapEnabled(next);
    if (next) enableSnap(canvas);
  }
  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-1 text-xs text-content-secondary">
      <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={showGrid} onChange={handleGrid} className="rounded" /><Grid3x3 className="h-3.5 w-3.5" />グリッド</label>
      <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={snapEnabled} onChange={handleSnap} className="rounded" /><Magnet className="h-3.5 w-3.5" />スナップ</label>
    </div>
  );
}
