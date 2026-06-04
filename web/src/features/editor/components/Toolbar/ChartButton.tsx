"use client";
import { BarChart3, LineChart, PieChart } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { addChart, type ChartType } from "@lib/fabric/tools/chart";
import { Popover } from "@shared/components/ui";
const SAMPLE = { labels: ["Q1","Q2","Q3","Q4"], values: [30,50,40,70] };

const OPTIONS: { type: ChartType; label: string; Icon: typeof BarChart3 }[] = [
  { type: "bar", label: "棒グラフ", Icon: BarChart3 },
  { type: "line", label: "折れ線", Icon: LineChart },
  { type: "pie", label: "円グラフ", Icon: PieChart },
  { type: "donut", label: "ドーナツ", Icon: PieChart },
];

export function ChartButton() {
  const { canvas } = useEditorStore();
  async function insert(type: ChartType) {
    if (!canvas) return;
    await addChart(canvas, type, SAMPLE);
  }
  return (
    <Popover
      align="left"
      trigger={({ toggle, ref }) => (
        <span ref={ref as (el: HTMLSpanElement | null) => void} className="inline-flex h-full">
          <button onClick={toggle} title="グラフ"
            className="flex h-full min-w-14 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
            <BarChart3 className="h-5 w-5" />
            <span className="text-[11px] leading-tight">グラフ</span>
          </button>
        </span>
      )}
    >
      {(close) => (
        <div className="w-36 p-1">
          {OPTIONS.map(({ type, label, Icon })=>(
            <button key={type} onClick={()=>{ insert(type); close(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-content-secondary hover:bg-primary-50 hover:text-primary-600 transition-colors">
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
