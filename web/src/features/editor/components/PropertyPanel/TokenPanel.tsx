"use client";
import { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { globalTokens } from "@lib/fabric/designTokens";
import { applyStyle } from "@lib/fabric/tools/style";
import { applyTextFormat } from "@lib/fabric/tools/text";

export function TokenPanel() {
  const { canvas } = useEditorStore();
  const [tab, setTab] = useState<"colors" | "text">("colors");

  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-1 text-xs">
        <button
          onClick={() => setTab("colors")}
          className={`flex-1 rounded py-1 font-medium ${tab === "colors" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          カラー
        </button>
        <button
          onClick={() => setTab("text")}
          className={`flex-1 rounded py-1 font-medium ${tab === "text" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          テキスト
        </button>
      </div>
      {tab === "colors" && (
        <div className="grid grid-cols-4 gap-2">
          {globalTokens.colors.map(c => (
            <button key={c.id}
              onClick={() => canvas && applyStyle(canvas, { fill: c.value })}
              title={c.name}
              className="aspect-square rounded-lg border-2 border-transparent hover:border-blue-400"
              style={{ backgroundColor: c.value }} />
          ))}
        </div>
      )}
      {tab === "text" && (
        <div className="space-y-1">
          {globalTokens.textStyles.map(s => (
            <button key={s.id}
              onClick={() => canvas && applyTextFormat(canvas, {
                fontSize: s.fontSize, fontFamily: s.fontFamily, fontWeight: s.fontWeight, fill: s.fill
              })}
              className="w-full rounded-lg border p-2 text-left hover:bg-gray-50">
              <span style={{ fontSize: Math.min(s.fontSize / 2, 16), fontWeight: s.fontWeight, color: s.fill }}>
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
