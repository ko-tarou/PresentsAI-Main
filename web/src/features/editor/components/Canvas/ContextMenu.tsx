"use client";
import { useEffect } from "react";
import { Copy, CopyPlus, BringToFront, SendToBack, Trash2 } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import {
  duplicateSelected, bringToFront, sendToBack, deleteSelected,
} from "@lib/fabric/tools/select";

export interface ContextMenuState {
  x: number;
  y: number;
}

export function ContextMenu({
  pos, onClose,
}: { pos: ContextMenuState | null; onClose: () => void }) {
  const { canvas } = useEditorStore();

  useEffect(() => {
    if (!pos) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onDown() {
      onClose();
    }
    document.addEventListener("keydown", onKey);
    // Defer so the same click that opened it doesn't immediately close it.
    const id = window.setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      window.clearTimeout(id);
    };
  }, [pos, onClose]);

  if (!pos || !canvas) return null;

  function run(fn: (c: NonNullable<typeof canvas>) => void) {
    if (canvas) fn(canvas);
    onClose();
  }

  const items = [
    { label: "コピー", icon: Copy, action: () => run(duplicateSelected) },
    { label: "複製", icon: CopyPlus, action: () => run(duplicateSelected) },
    { label: "最前面へ移動", icon: BringToFront, action: () => run(bringToFront) },
    { label: "最背面へ移動", icon: SendToBack, action: () => run(sendToBack) },
  ];

  return (
    <div
      role="menu"
      className="fixed z-[100] min-w-44 rounded-xl border border-border bg-surface py-1 shadow-modal"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it) => (
        <button
          key={it.label}
          role="menuitem"
          onClick={it.action}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-content-primary hover:bg-surface-subtle"
        >
          <it.icon className="h-4 w-4" />
          {it.label}
        </button>
      ))}
      <div className="my-1 h-px bg-border" />
      <button
        role="menuitem"
        onClick={() => run(deleteSelected)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-error hover:bg-surface-subtle"
      >
        <Trash2 className="h-4 w-4" />
        削除
      </button>
    </div>
  );
}
