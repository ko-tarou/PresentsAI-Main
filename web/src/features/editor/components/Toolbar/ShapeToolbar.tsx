"use client";
import { Shapes, Square, Circle, Triangle, Minus, ArrowRight, Star, Diamond } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { addShape, type ShapeType } from "@lib/fabric/tools/shapes";
import { Popover } from "@shared/components/ui";

const SHAPES: { type: ShapeType; label: string; Icon: typeof Square }[] = [
  { type: "rect", label: "矩形", Icon: Square },
  { type: "circle", label: "円", Icon: Circle },
  { type: "triangle", label: "三角形", Icon: Triangle },
  { type: "line", label: "直線", Icon: Minus },
  { type: "arrow", label: "矢印", Icon: ArrowRight },
  { type: "star", label: "星", Icon: Star },
  { type: "diamond", label: "菱形", Icon: Diamond },
];

export function ShapeToolbar() {
  const { canvas } = useEditorStore();
  return (
    <Popover
      align="left"
      trigger={({ toggle, ref }) => (
        <span ref={ref as (el: HTMLSpanElement | null) => void} className="inline-flex h-full">
          <button onClick={toggle} title="図形"
            className="flex h-full min-w-14 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
            <Shapes className="h-5 w-5" />
            <span className="text-[11px] leading-tight">図形</span>
          </button>
        </span>
      )}
    >
      {(close) => (
        <div className="grid grid-cols-4 gap-1 p-2">
          {SHAPES.map(({ type, label, Icon }) => (
            <button key={type} onClick={() => { canvas && addShape(canvas, type); close(); }} title={label}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-content-secondary hover:bg-primary-50 hover:text-primary-600 transition-colors">
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
