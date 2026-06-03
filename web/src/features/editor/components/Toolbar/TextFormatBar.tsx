"use client";
import { useEditorStore } from "../../stores/editorStore";
import { applyTextFormat } from "@lib/fabric/tools/text";
import { IText } from "fabric";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";

export function TextFormatBar() {
  const { canvas } = useEditorStore();
  const obj = canvas?.getActiveObject();
  const isText = obj instanceof IText;

  if (!isText) return null;

  function apply(format: Parameters<typeof applyTextFormat>[1]) {
    if (canvas) applyTextFormat(canvas, format);
  }

  const iconButton =
    "flex h-7 w-7 items-center justify-center rounded-lg text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors";

  return (
    <div className="flex items-center gap-1 border-b border-border bg-surface px-4 py-1">
      <select
        className="h-7 rounded-lg border border-border px-2 text-xs"
        onChange={(e) => apply({ fontFamily: e.target.value })}
        defaultValue="sans-serif"
      >
        {["sans-serif", "serif", "monospace", "Georgia", "Arial", "Helvetica"].map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <input
        type="number"
        className="h-7 w-14 rounded-lg border border-border px-2 text-xs"
        defaultValue={24}
        min={8}
        max={200}
        onChange={(e) => apply({ fontSize: Number(e.target.value) })}
      />
      <button onClick={() => apply({ fontWeight: "bold" })} title="太字" className={iconButton}>
        <Bold className="h-4 w-4" />
      </button>
      <button onClick={() => apply({ fontStyle: "italic" })} title="斜体" className={iconButton}>
        <Italic className="h-4 w-4" />
      </button>
      <button onClick={() => apply({ underline: true })} title="下線" className={iconButton}>
        <Underline className="h-4 w-4" />
      </button>
      <div className="mx-1 h-4 w-px bg-border" />
      <button onClick={() => apply({ textAlign: "left" })} title="左揃え" className={iconButton}>
        <AlignLeft className="h-4 w-4" />
      </button>
      <button onClick={() => apply({ textAlign: "center" })} title="中央揃え" className={iconButton}>
        <AlignCenter className="h-4 w-4" />
      </button>
      <button onClick={() => apply({ textAlign: "right" })} title="右揃え" className={iconButton}>
        <AlignRight className="h-4 w-4" />
      </button>
      <div className="mx-1 h-4 w-px bg-border" />
      <label className="flex items-center gap-1 text-content-secondary" title="文字色">
        <Type className="h-4 w-4" />
        <input
          type="color"
          className="h-6 w-6 cursor-pointer rounded-lg border border-border"
          defaultValue="#000000"
          onChange={(e) => apply({ fill: e.target.value })}
        />
      </label>
    </div>
  );
}
