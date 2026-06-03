"use client";
import { useEditorStore } from "../../stores/editorStore";
import { addShape, type ShapeType } from "@lib/fabric/tools/shapes";

const SHAPES: { type: ShapeType; label: string; emoji: string }[] = [
  { type: "rect", label: "矩形", emoji: "⬜" },
  { type: "circle", label: "円", emoji: "⭕" },
  { type: "triangle", label: "三角形", emoji: "🔺" },
  { type: "line", label: "直線", emoji: "➖" },
  { type: "arrow", label: "矢印", emoji: "➡️" },
  { type: "star", label: "星", emoji: "⭐" },
  { type: "diamond", label: "菱形", emoji: "🔷" },
];

export function ShapeToolbar() {
  const { canvas } = useEditorStore();

  return (
    <div className="flex flex-wrap gap-1 p-2">
      {SHAPES.map(({ type, label, emoji }) => (
        <button
          key={type}
          onClick={() => canvas && addShape(canvas, type)}
          title={label}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-lg hover:bg-blue-50 hover:ring-1 hover:ring-blue-300"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
