"use client";
import { useEffect, useState } from "react";
import type { Canvas, FabricObject } from "fabric";
import {
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Minus,
  Pencil,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { ensureObjectId } from "@lib/fabric/objectId";

/** One row of the selection pane: a stable id plus what we render for it. */
interface LayerRow {
  id: string;
  label: string;
  Icon: LucideIcon;
}

const ICONS: Record<string, LucideIcon> = {
  textbox: Type,
  "i-text": Type,
  text: Type,
  rect: Square,
  triangle: Square,
  circle: Circle,
  ellipse: Circle,
  image: ImageIcon,
  line: Minus,
  path: Pencil,
};

const LABELS: Record<string, string> = {
  textbox: "テキスト",
  "i-text": "テキスト",
  text: "テキスト",
  rect: "四角形",
  triangle: "三角形",
  circle: "円",
  ellipse: "楕円",
  image: "画像",
  line: "線",
  path: "フリーハンド",
  group: "グループ",
  "active-selection": "選択範囲",
};

function describe(obj: FabricObject): { label: string; Icon: LucideIcon } {
  const type = (obj.type ?? "object").toLowerCase();
  return { label: LABELS[type] ?? type, Icon: ICONS[type] ?? Layers };
}

/**
 * Reads the canvas's z-ordered object list into display rows. Fabric stores
 * index 0 at the *back*; the panel lists front-most first (Figma/PowerPoint
 * convention), so we reverse.
 */
function readRows(canvas: Canvas): LayerRow[] {
  return canvas
    .getObjects()
    .map((obj) => {
      const { label, Icon } = describe(obj);
      return { id: ensureObjectId(obj), label, Icon };
    })
    .reverse();
}

/**
 * Selection pane (layers / object list) for the active slide.
 *
 * Lists the active slide's Fabric objects front-to-back, keyed by their stable
 * round-tripped id (commit #96). Clicking a row selects that object on the
 * canvas; dragging a row reorders z-index. Reordering is delegated to
 * `moveObject` (see {@link useObjectBinding}) so the change flows through the
 * Yjs binding and stays consistent across collaborators.
 *
 * Visibility / lock toggles and group nesting are intentionally out of scope
 * (future PR).
 */
export function LayersPanel({
  moveObject,
}: {
  moveObject: (id: string, toIndex: number) => void;
}) {
  const canvas = useEditorStore((s) => s.canvas);
  const [rows, setRows] = useState<LayerRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // Track the canvas object list and current selection.
  useEffect(() => {
    if (!canvas) {
      setRows([]);
      setActiveId(null);
      return;
    }
    const refresh = () => setRows(readRows(canvas));
    const syncSelection = () => {
      const active = canvas.getActiveObject() as (FabricObject & { id?: string }) | null;
      setActiveId(active?.id ?? null);
    };
    refresh();
    syncSelection();

    const events = [
      "object:added",
      "object:removed",
      "object:modified",
      "selection:created",
      "selection:updated",
      "selection:cleared",
    ] as const;
    const onAny = () => {
      refresh();
      syncSelection();
    };
    events.forEach((e) => canvas.on(e, onAny));
    return () => events.forEach((e) => canvas.off(e, onAny));
  }, [canvas]);

  function select(id: string) {
    if (!canvas) return;
    const obj = canvas
      .getObjects()
      .find((o) => (o as FabricObject & { id?: string }).id === id);
    if (!obj) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setActiveId(id);
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId || !canvas) {
      setDragId(null);
      return;
    }
    // Rows are front-first; translate the drop target to a Fabric (back-first)
    // z-index by mirroring across the list length.
    const total = canvas.getObjects().length;
    const targetRow = rows.findIndex((r) => r.id === targetId);
    const zIndex = total - 1 - targetRow;
    moveObject(dragId, zIndex);
    setDragId(null);
  }

  if (!canvas) return null;

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-xs font-semibold text-content-secondary">
        <Layers className="h-3.5 w-3.5" />
        レイヤー
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rows.length === 0 ? (
          <p className="px-3 py-2 text-xs text-content-tertiary">オブジェクトがありません</p>
        ) : (
          rows.map(({ id, label, Icon }) => (
            <div
              key={id}
              draggable
              onDragStart={() => setDragId(id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(id)}
              onClick={() => select(id)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                id === activeId
                  ? "bg-primary-100 text-primary-700"
                  : "text-content-secondary hover:bg-surface-muted"
              } ${dragId === id ? "opacity-50" : ""}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
