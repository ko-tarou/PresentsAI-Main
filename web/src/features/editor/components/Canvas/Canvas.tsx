"use client";
import { useRef, useEffect } from "react";
import { useCanvas } from "../../hooks/useCanvas";
import { useEditorStore } from "../../stores/editorStore";

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef, initCanvas } = useCanvas(containerRef);

  // Ctrl/Cmd + scroll to zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const { canvas, zoom, setZoom } = useEditorStore.getState();
      if (!canvas) return;
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newZoom = Math.max(0.1, Math.min(3, zoom + delta));
      canvas.setZoom(newZoom);
      canvas.renderAll();
      setZoom(newZoom);
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div ref={containerRef} className="flex h-full items-center justify-center bg-gray-200 p-8">
      <div className="shadow-xl">
        <canvas
          ref={(el) => {
            if (el && !canvasRef.current) {
              (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
              initCanvas(el);
            }
          }}
        />
      </div>
    </div>
  );
}
