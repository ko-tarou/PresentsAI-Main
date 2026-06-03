"use client";
import { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { globalComponentLibrary, createComponentFromSelection } from "@lib/fabric/components";

export function ComponentPanel() {
  const { canvas } = useEditorStore();
  const [components, setComponents] = useState(() => globalComponentLibrary.list());
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  async function saveAsComponent() {
    if (!canvas || !name.trim()) return;
    await createComponentFromSelection(canvas, globalComponentLibrary, name);
    setComponents(globalComponentLibrary.list());
    setName("");
  }

  async function instantiate(id: string) {
    if (!canvas) return;
    await globalComponentLibrary.instantiate(canvas, id);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-1 rounded-lg px-3 text-sm hover:bg-blue-50"
        title="コンポーネント">
        🧩<span className="text-xs">コンポ</span>
      </button>
      {open && (
        <div className="absolute left-0 top-12 z-10 rounded-xl border bg-white shadow-lg p-3 w-56 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">選択中をコンポーネントとして保存</p>
            <div className="flex gap-1">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="名前"
                className="flex-1 rounded border px-2 py-1 text-xs focus:outline-none" />
              <button onClick={saveAsComponent} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">保存</button>
            </div>
          </div>
          {components.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">コンポーネント一覧</p>
              {components.map(c => (
                <button key={c.id} onClick={() => instantiate(c.id)}
                  className="w-full rounded px-3 py-2 text-left text-xs hover:bg-gray-50">
                  🧩 {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
