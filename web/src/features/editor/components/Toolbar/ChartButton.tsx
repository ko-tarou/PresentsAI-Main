"use client";
import { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { addChart, type ChartType } from "@lib/fabric/tools/chart";
const SAMPLE = { labels: ["Q1","Q2","Q3","Q4"], values: [30,50,40,70] };

export function ChartButton() {
  const { canvas } = useEditorStore();
  const [open, setOpen] = useState(false);
  async function insert(type: ChartType) {
    if (!canvas) return;
    await addChart(canvas, type, SAMPLE); setOpen(false);
  }
  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-lg text-lg hover:bg-blue-50" title="グラフ">📊</button>
      {open && (
        <div className="absolute left-0 top-12 z-10 rounded-xl border bg-white shadow-lg p-2 w-32">
          {(["bar","line","pie","donut"] as ChartType[]).map(t=>(
            <button key={t} onClick={()=>insert(t)} className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-50">
              {t==="bar"?"棒グラフ":t==="line"?"折れ線":t==="pie"?"円グラフ":"ドーナツ"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
