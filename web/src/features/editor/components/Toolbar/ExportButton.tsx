"use client";
import { useState } from "react";
import { Download, FileText, FileImage, FileCode, Presentation } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { exportToPDF } from "@lib/export/pdf";
import { exportAllSlidesToPNG, exportToSVG } from "@lib/export/png";
import { exportToPPTX } from "@lib/export/pptx";
import { Popover } from "@shared/components/ui";

export function ExportButton() {
  const { canvas } = useEditorStore();
  const slides = useSlideStore((s) => s.slides);
  const [busy, setBusy] = useState(false);
  async function run(fn: ()=>Promise<void>|void, close: () => void) {
    if (!canvas) return; setBusy(true); close();
    try { await fn(); } finally { setBusy(false); }
  }
  const OPTIONS = [
    { l: "PDF として保存", Icon: FileText, fn: () => exportToPDF(slides) },
    { l: "PNG として保存", Icon: FileImage, fn: () => exportAllSlidesToPNG(slides) },
    { l: "SVG として保存", Icon: FileCode, fn: () => exportToSVG(canvas!) },
    { l: "PPTX として保存", Icon: Presentation, fn: () => exportToPPTX(slides) },
  ];
  return (
    <Popover
      align="right"
      trigger={({ toggle, ref }) => (
        <span ref={ref as (el: HTMLSpanElement | null) => void} className="inline-flex">
          <button onClick={toggle} disabled={busy}
            className="btn btn-secondary btn-sm gap-1.5 disabled:opacity-50">
            <Download className="h-4 w-4" />{busy?"出力中...":"エクスポート"}
          </button>
        </span>
      )}
    >
      {(close) => (
        <div className="w-44 p-1">
          {OPTIONS.map(({l,Icon,fn})=>(
            <button key={l} onClick={()=>run(fn, close)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-content-secondary hover:bg-primary-50 hover:text-primary-600 transition-colors">
              <Icon className="h-4 w-4" />{l}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
