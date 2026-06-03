"use client";
import { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { applyStyle, applyLinearGradient } from "@lib/fabric/tools/style";

export function StylePanel() {
  const { canvas } = useEditorStore();
  const [tab, setTab] = useState<"fill" | "stroke" | "effects">("fill");
  const [grad1, setGrad1] = useState("#4A90E2");
  const [grad2, setGrad2] = useState("#7ED321");

  if (!canvas) return null;

  return (
    <aside className="w-56 shrink-0 border-l bg-white overflow-y-auto">
      <div className="flex border-b text-xs">
        {(["fill","stroke","effects"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 font-medium ${tab===t?"border-b-2 border-blue-600 text-blue-600":"text-gray-500"}`}
          >{t==="fill"?"塗り":t==="stroke"?"線":"エフェクト"}</button>
        ))}
      </div>

      <div className="p-3 space-y-3">
        {tab === "fill" && (
          <>
            <label className="block text-xs text-gray-500">単色</label>
            <input type="color" defaultValue="#4A90E2"
              onChange={(e) => applyStyle(canvas, { fill: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border" />
            <label className="block text-xs text-gray-500 mt-2">グラデーション</label>
            <div className="flex gap-2">
              <input type="color" value={grad1} onChange={(e) => setGrad1(e.target.value)} className="h-8 w-full cursor-pointer rounded border" />
              <input type="color" value={grad2} onChange={(e) => setGrad2(e.target.value)} className="h-8 w-full cursor-pointer rounded border" />
            </div>
            <button onClick={() => applyLinearGradient(canvas, grad1, grad2)}
              className="w-full rounded bg-gray-100 py-1 text-xs hover:bg-gray-200">適用</button>
            <button onClick={() => applyStyle(canvas, { fill: "transparent" })}
              className="w-full rounded border py-1 text-xs text-gray-500 hover:bg-gray-50">塗りなし</button>
          </>
        )}

        {tab === "stroke" && (
          <>
            <label className="block text-xs text-gray-500">線の色</label>
            <input type="color" defaultValue="#333333"
              onChange={(e) => applyStyle(canvas, { stroke: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border" />
            <label className="block text-xs text-gray-500 mt-2">線の太さ</label>
            <input type="range" min="0" max="20" defaultValue="2"
              onChange={(e) => applyStyle(canvas, { strokeWidth: Number(e.target.value) })}
              className="w-full" />
          </>
        )}

        {tab === "effects" && (
          <>
            <label className="block text-xs text-gray-500">不透明度</label>
            <input type="range" min="0" max="1" step="0.01" defaultValue="1"
              onChange={(e) => applyStyle(canvas, { opacity: Number(e.target.value) })}
              className="w-full" />
            <label className="block text-xs text-gray-500 mt-2">シャドウ</label>
            <button onClick={() => applyStyle(canvas, { shadow: { color: "rgba(0,0,0,0.3)", blur: 10, offsetX: 4, offsetY: 4 } })}
              className="w-full rounded bg-gray-100 py-1 text-xs hover:bg-gray-200">影を追加</button>
            <button onClick={() => applyStyle(canvas, { shadow: null })}
              className="w-full rounded border py-1 text-xs text-gray-500 hover:bg-gray-50">影を削除</button>
          </>
        )}
      </div>
    </aside>
  );
}
