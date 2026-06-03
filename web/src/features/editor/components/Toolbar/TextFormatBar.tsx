"use client";
import { useEditorStore } from "../../stores/editorStore";
import { applyTextFormat } from "@lib/fabric/tools/text";
import { IText } from "fabric";

export function TextFormatBar() {
  const { canvas } = useEditorStore();
  const obj = canvas?.getActiveObject();
  const isText = obj instanceof IText;

  if (!isText) return null;

  function apply(format: Parameters<typeof applyTextFormat>[1]) {
    if (canvas) applyTextFormat(canvas, format);
  }

  return (
    <div className="flex items-center gap-1 border-b bg-white px-4 py-1">
      <select
        className="rounded border px-2 py-1 text-xs"
        onChange={(e) => apply({ fontFamily: e.target.value })}
        defaultValue="sans-serif"
      >
        {["sans-serif", "serif", "monospace", "Georgia", "Arial", "Helvetica"].map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <input
        type="number"
        className="w-14 rounded border px-2 py-1 text-xs"
        defaultValue={24}
        min={8}
        max={200}
        onChange={(e) => apply({ fontSize: Number(e.target.value) })}
      />
      <button onClick={() => apply({ fontWeight: "bold" })} className="rounded px-2 py-1 text-xs font-bold hover:bg-gray-100">B</button>
      <button onClick={() => apply({ fontStyle: "italic" })} className="rounded px-2 py-1 text-xs italic hover:bg-gray-100">I</button>
      <button onClick={() => apply({ underline: true })} className="rounded px-2 py-1 text-xs underline hover:bg-gray-100">U</button>
      <div className="mx-1 h-4 w-px bg-gray-200" />
      {(["left", "center", "right"] as const).map((align) => (
        <button key={align} onClick={() => apply({ textAlign: align })} className="rounded px-2 py-1 text-xs hover:bg-gray-100">
          {align === "left" ? "⬅" : align === "center" ? "⬛" : "➡"}
        </button>
      ))}
      <div className="mx-1 h-4 w-px bg-gray-200" />
      <input
        type="color"
        className="h-6 w-6 cursor-pointer rounded border"
        defaultValue="#000000"
        onChange={(e) => apply({ fill: e.target.value })}
        title="文字色"
      />
    </div>
  );
}
