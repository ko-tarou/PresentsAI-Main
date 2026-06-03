"use client";
import { useEditorStore } from "../../stores/editorStore";
import { fitToContainer, SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

export function ZoomControls() {
  const { canvas, zoom, setZoom } = useEditorStore();

  function adjustZoom(delta: number) {
    if (!canvas) return;
    const newZoom = Math.max(0.1, Math.min(3, zoom + delta));
    canvas.setZoom(newZoom);
    canvas.setWidth(SLIDE_WIDTH * newZoom);
    canvas.setHeight(SLIDE_HEIGHT * newZoom);
    canvas.renderAll();
    setZoom(newZoom);
  }

  function resetZoom() {
    if (!canvas) return;
    const el = (canvas.wrapperEl as HTMLElement)?.parentElement?.parentElement;
    if (el) {
      const scale = fitToContainer(canvas, el.clientWidth);
      setZoom(scale);
    }
  }

  const pct = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-0.5 border-l pl-2">
      <button
        onClick={() => adjustZoom(-0.1)}
        className="rounded px-2 py-1 text-sm hover:bg-gray-100"
        title="縮小 (-)"
      >
        −
      </button>
      <button
        onClick={resetZoom}
        className="rounded px-2 py-1 text-xs font-mono hover:bg-gray-100 min-w-12 text-center"
        title="ズームリセット"
      >
        {pct}%
      </button>
      <button
        onClick={() => adjustZoom(0.1)}
        className="rounded px-2 py-1 text-sm hover:bg-gray-100"
        title="拡大 (+)"
      >
        +
      </button>
    </div>
  );
}
