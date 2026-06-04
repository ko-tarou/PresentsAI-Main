"use client";
import { useState } from "react";
import { Puzzle } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { globalComponentLibrary, createComponentFromSelection } from "@lib/fabric/components";
import { Popover } from "@shared/components/ui";

export function ComponentPanel() {
  const { canvas } = useEditorStore();
  const [components, setComponents] = useState(() => globalComponentLibrary.list());
  const [name, setName] = useState("");

  async function saveAsComponent() {
    if (!canvas || !name.trim()) return;
    await createComponentFromSelection(canvas, globalComponentLibrary, name);
    setComponents(globalComponentLibrary.list());
    setName("");
  }

  async function instantiate(id: string, close: () => void) {
    if (!canvas) return;
    await globalComponentLibrary.instantiate(canvas, id);
    close();
  }

  return (
    <Popover
      align="left"
      trigger={({ toggle, ref }) => (
        <span ref={ref as (el: HTMLSpanElement | null) => void} className="inline-flex">
          <button onClick={toggle} title="コンポーネント"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
            <Puzzle className="h-4 w-4" /><span className="text-xs">コンポ</span>
          </button>
        </span>
      )}
    >
      {(close) => (
        <div className="w-56 space-y-3 p-3">
          <div>
            <p className="mb-1 text-xs font-medium text-content-secondary">選択中をコンポーネントとして保存</p>
            <div className="flex gap-1">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="名前"
                className="input flex-1 px-2 py-1 text-xs" />
              <button onClick={saveAsComponent} className="btn btn-primary btn-sm">保存</button>
            </div>
          </div>
          {components.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-content-secondary">コンポーネント一覧</p>
              {components.map(c => (
                <button key={c.id} onClick={() => instantiate(c.id, close)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-content-secondary hover:bg-primary-50 hover:text-primary-600 transition-colors">
                  <Puzzle className="h-3.5 w-3.5" /> {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Popover>
  );
}
