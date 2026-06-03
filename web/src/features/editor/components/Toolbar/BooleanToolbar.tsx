"use client";
import { useEditorStore } from "../../stores/editorStore";
import { performBoolean } from "@lib/fabric/tools/boolean";

type BooleanOpLabel = { op: "union" | "subtract" | "intersect" | "exclude"; label: string; emoji: string };

const OPS: BooleanOpLabel[] = [
  { op: "union", label: "合体", emoji: "🔵" },
  { op: "subtract", label: "差分", emoji: "🔘" },
  { op: "intersect", label: "交差", emoji: "⚫" },
  { op: "exclude", label: "除外", emoji: "⭕" },
];

export function BooleanToolbar() {
  const { canvas } = useEditorStore();
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b">
      {OPS.map(({ op, label, emoji }) => (
        <button key={op} onClick={() => canvas && performBoolean(canvas, op)}
          title={label}
          className="flex h-8 items-center gap-1 rounded px-2 text-xs hover:bg-gray-100">
          {emoji} {label}
        </button>
      ))}
    </div>
  );
}
