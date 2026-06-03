"use client";
import { useState } from "react";
import { BarChart3, LineChart, PieChart } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { addChart, type ChartType } from "@lib/fabric/tools/chart";
const SAMPLE = { labels: ["Q1","Q2","Q3","Q4"], values: [30,50,40,70] };

const OPTIONS: { type: ChartType; label: string; Icon: typeof BarChart3 }[] = [
  { type: "bar", label: "棒グラフ", Icon: BarChart3 },
  { type: "line", label: "折れ線", Icon: LineChart },
  { type: "pie", label: "円グラフ", Icon: PieChart },
  { type: "donut", label: "ドーナツ", Icon: PieChart },
];

export function ChartButton() {
  const { canvas } = useEditorStore();
  const [open, setOpen] = useState(false);
  async function insert(type: ChartType) {
    if (!canvas) return;
    await addChart(canvas, type, SAMPLE); setOpen(false);
  }
  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)} title="グラフ"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
        <BarChart3 className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-20 w-36 rounded-xl border border-border bg-surface p-1 shadow-modal">
            {OPTIONS.map(({ type, label, Icon })=>(
              <button key={type} onClick={()=>insert(type)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-content-secondary hover:bg-primary-50 hover:text-primary-600 transition-colors">
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
