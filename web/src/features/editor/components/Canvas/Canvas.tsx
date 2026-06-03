"use client";
import { useRef, useEffect } from "react";
import { useCanvas } from "../../hooks/useCanvas";

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef, initCanvas } = useCanvas(containerRef);

  useEffect(() => {
    if (canvasRef.current) return; // already initialized
  }, [canvasRef]);

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
