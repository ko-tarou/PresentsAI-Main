"use client";
import { Combine, SquareMinus, Diamond, SquareDashed } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { performBoolean } from "@lib/fabric/tools/boolean";

type BooleanOpLabel = { op: "union" | "subtract" | "intersect" | "exclude"; label: string; Icon: typeof Combine };

const OPS: BooleanOpLabel[] = [
  { op: "union", label: "合体", Icon: Combine },
  { op: "subtract", label: "差分", Icon: SquareMinus },
  { op: "intersect", label: "交差", Icon: Diamond },
  { op: "exclude", label: "除外", Icon: SquareDashed },
];

export function BooleanToolbar() {
  const { canvas } = useEditorStore();
  return (
    <div className="flex items-center gap-1 border-b border-border px-2 py-1">
      {OPS.map(({ op, label, Icon }) => (
        <button key={op} onClick={() => canvas && performBoolean(canvas, op)}
          title={label}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
}
