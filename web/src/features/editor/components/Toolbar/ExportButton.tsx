"use client";
import { useState } from "react";
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
  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)} disabled={busy} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
        {busy?"出力中...":"⬇ エクスポート"}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-10 rounded-xl border bg-white shadow-lg w-44">
          {[
            {l:"PDF として保存", fn:()=>exportToPDF(canvas!)},
            {l:"PNG として保存", fn:()=>exportToPNG(canvas!)},
            {l:"SVG として保存", fn:()=>exportToSVG(canvas!)},
            {l:"PPTX として保存", fn:()=>exportToPPTX(canvas!)},
          ].map(({l,fn})=>(
            <button key={l} onClick={()=>run(fn)} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl">{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}
