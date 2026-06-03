"use client";
import { useState } from "react";
import { Download, FileText, FileImage, FileCode, Presentation } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { exportToPDF } from "@lib/export/pdf";
import { exportToPNG, exportToSVG } from "@lib/export/png";
import { exportToPPTX } from "@lib/export/pptx";

export function ExportButton() {
  const { canvas } = useEditorStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function run(fn: ()=>Promise<void>|void) {
    if (!canvas) return; setBusy(true); setOpen(false);
    try { await fn(); } finally { setBusy(false); }
  }
  const OPTIONS = [
    { l: "PDF として保存", Icon: FileText, fn: () => exportToPDF(canvas!) },
    { l: "PNG として保存", Icon: FileImage, fn: () => exportToPNG(canvas!) },
    { l: "SVG として保存", Icon: FileCode, fn: () => exportToSVG(canvas!) },
    { l: "PPTX として保存", Icon: Presentation, fn: () => exportToPPTX(canvas!) },
  ];
  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)} disabled={busy}
        className="btn btn-secondary btn-sm gap-1.5 disabled:opacity-50">
        <Download className="h-4 w-4" />{busy?"出力中...":"エクスポート"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border bg-surface p-1 shadow-modal">
            {OPTIONS.map(({l,Icon,fn})=>(
              <button key={l} onClick={()=>run(fn)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-content-secondary hover:bg-primary-50 hover:text-primary-600 transition-colors">
                <Icon className="h-4 w-4" />{l}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
