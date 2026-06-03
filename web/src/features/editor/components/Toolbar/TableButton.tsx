"use client";
import { useState } from "react";
import { Table } from "lucide-react";
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
      <button onClick={()=>setOpen(!open)} title="テーブル"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
        <Table className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-20 w-44 space-y-2 rounded-xl border border-border bg-surface p-3 shadow-modal">
            <label className="flex items-center justify-between text-xs text-content-secondary">行数 <input type="number" min="1" max="20" value={rows} onChange={e=>setRows(Number(e.target.value))} className="input w-16 px-2 py-1 text-xs"/></label>
            <label className="flex items-center justify-between text-xs text-content-secondary">列数 <input type="number" min="1" max="10" value={cols} onChange={e=>setCols(Number(e.target.value))} className="input w-16 px-2 py-1 text-xs"/></label>
            <button onClick={insert} className="btn btn-primary btn-sm w-full">挿入</button>
          </div>
        </>
      )}
    </div>
  );
}
