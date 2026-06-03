"use client";
import { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { addTable } from "@lib/fabric/tools/table";

export function TableButton() {
  const { canvas } = useEditorStore();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  function insert() { if (!canvas) return; addTable(canvas, { rows, cols }); setOpen(false); }
  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-lg text-lg hover:bg-blue-50" title="テーブル">🏓</button>
      {open && (
        <div className="absolute left-0 top-12 z-10 rounded-xl border bg-white shadow-lg p-3 w-44 space-y-2">
          <label className="flex items-center justify-between text-xs text-gray-600">行数 <input type="number" min="1" max="20" value={rows} onChange={e=>setRows(Number(e.target.value))} className="w-16 rounded border px-2 py-1 text-xs"/></label>
          <label className="flex items-center justify-between text-xs text-gray-600">列数 <input type="number" min="1" max="10" value={cols} onChange={e=>setCols(Number(e.target.value))} className="w-16 rounded border px-2 py-1 text-xs"/></label>
          <button onClick={insert} className="w-full rounded bg-blue-600 py-1.5 text-xs text-white font-semibold hover:bg-blue-700">挿入</button>
        </div>
      )}
    </div>
  );
}
