"use client";
import { useRef, useEffect, useState } from "react";
import { useCanvas } from "../../hooks/useCanvas";
import { useEditorStore } from "../../stores/editorStore";
import { ContextMenu, type ContextMenuState } from "./ContextMenu";

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef, initCanvas } = useCanvas(containerRef);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  function handleContextMenu(e: React.MouseEvent) {
    const { canvas } = useEditorStore.getState();
    if (!canvas) return;
    // Only show the menu when right-clicking over an object.
    if (!canvas.getActiveObject()) {
      setMenu(null);
      return;
    }
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  }

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
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      className="flex h-full items-center justify-center bg-gray-200 p-8"
    >
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
      <ContextMenu pos={menu} onClose={() => setMenu(null)} />
    </div>
  );
}
