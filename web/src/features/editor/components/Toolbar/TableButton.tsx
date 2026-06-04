"use client";
import { useState } from "react";
import { Table } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { addTable } from "@lib/fabric/tools/table";
import { Popover } from "@shared/components/ui";

export function TableButton() {
  const { canvas } = useEditorStore();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  function insert(close: () => void) { if (!canvas) return; addTable(canvas, { rows, cols }); close(); }
  return (
    <Popover
      align="left"
      trigger={({ toggle, ref }) => (
        <span ref={ref as (el: HTMLSpanElement | null) => void} className="inline-flex">
          <button onClick={toggle} title="テーブル"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
            <Table className="h-4 w-4" />
          </button>
        </span>
      )}
    >
      {(close) => (
        <div className="w-44 space-y-2 p-3">
          <label className="flex items-center justify-between text-xs text-content-secondary">行数 <input type="number" min="1" max="20" value={rows} onChange={e=>setRows(Number(e.target.value))} className="input w-16 px-2 py-1 text-xs"/></label>
          <label className="flex items-center justify-between text-xs text-content-secondary">列数 <input type="number" min="1" max="10" value={cols} onChange={e=>setCols(Number(e.target.value))} className="input w-16 px-2 py-1 text-xs"/></label>
          <button onClick={()=>insert(close)} className="btn btn-primary btn-sm w-full">挿入</button>
        </div>
      )}
    </Popover>
  );
}
