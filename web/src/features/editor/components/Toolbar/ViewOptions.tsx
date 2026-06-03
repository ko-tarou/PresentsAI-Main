"use client";
import { useState } from "react";
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
    <div className="flex items-center gap-3 px-3 py-1 text-xs text-gray-600 border-b">
      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={showGrid} onChange={handleGrid} className="rounded" />グリッド</label>
      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={snapEnabled} onChange={handleSnap} className="rounded" />スナップ</label>
    </div>
  );
}
