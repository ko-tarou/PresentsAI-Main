"use client";
import {
  Copy, Trash2,
  Bold, Italic, Underline, Strikethrough, ChevronUp, ChevronDown, Baseline, Highlighter,
  List, ListOrdered, IndentDecrease, IndentIncrease,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Rows3,
  BringToFront, SendToBack, PaintBucket, Square as SquareIcon,
  MousePointerClick,
} from "lucide-react";
import { IText, ActiveSelection } from "fabric";
import { useEditorStore } from "../../stores/editorStore";
import { applyTextFormat } from "@lib/fabric/tools/text";
import { applyStyle } from "@lib/fabric/tools/style";
import { convertToUnorderedList, setLineHeight } from "@lib/fabric/tools/richText";
import {
  deleteSelected, duplicateSelected, bringToFront, sendToBack,
} from "@lib/fabric/tools/select";
import { RibbonGroup, RibbonDivider, RibbonIconButton } from "./ribbonPrimitives";
import { NewSlideButton } from "./NewSlideButton";

const FONT_FAMILIES = [
  "sans-serif", "serif", "monospace", "Arial", "Helvetica",
  "Georgia", "Times New Roman", "游ゴシック", "游明朝", "メイリオ",
];

export function HomeTab() {
  const { canvas } = useEditorStore();

  function fmt(format: Parameters<typeof applyTextFormat>[1]) {
    if (canvas) applyTextFormat(canvas, format);
  }

  // current font size of active text (fallback 24)
  function currentSize(): number {
    const obj = canvas?.getActiveObject();
    if (obj instanceof IText) return Math.round(obj.fontSize ?? 24);
    return 24;
  }

  function bumpSize(delta: number) {
    fmt({ fontSize: Math.max(8, Math.min(200, currentSize() + delta)) });
  }

  function toggleStrike() {
    const obj = canvas?.getActiveObject();
    if (!canvas || !(obj instanceof IText)) return;
    obj.set("linethrough", !obj.linethrough);
    canvas.requestRenderAll();
  }

  return (
    <div className="flex h-full items-stretch">
      {/* スライド */}
      <RibbonGroup label="スライド">
        <NewSlideButton />
        <div className="flex flex-col gap-0.5">
          <RibbonIconButton icon={<Copy />} title="複製 (⌘D)" onClick={() => canvas && duplicateSelected(canvas)} />
          <RibbonIconButton icon={<Trash2 />} title="削除 (Del)" onClick={() => canvas && deleteSelected(canvas)} />
        </div>
      </RibbonGroup>

      <RibbonDivider />

      {/* フォント */}
      <RibbonGroup label="フォント">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <select
              className="h-6 w-28 rounded border border-border bg-surface px-1 text-[11px] text-content-primary"
              defaultValue="sans-serif"
              title="フォント"
              onChange={(e) => fmt({ fontFamily: e.target.value })}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <input
              type="number" min={8} max={200} defaultValue={24}
              title="フォントサイズ"
              className="h-6 w-12 rounded border border-border bg-surface px-1 text-[11px] text-content-primary"
              onChange={(e) => fmt({ fontSize: Number(e.target.value) })}
            />
            <RibbonIconButton icon={<ChevronUp />} title="文字を大きく" onClick={() => bumpSize(2)} />
            <RibbonIconButton icon={<ChevronDown />} title="文字を小さく" onClick={() => bumpSize(-2)} />
          </div>
          <div className="flex items-center gap-0.5">
            <RibbonIconButton icon={<Bold />} title="太字" onClick={() => fmt({ fontWeight: "bold" })} />
            <RibbonIconButton icon={<Italic />} title="斜体" onClick={() => fmt({ fontStyle: "italic" })} />
            <RibbonIconButton icon={<Underline />} title="下線" onClick={() => fmt({ underline: true })} />
            <RibbonIconButton icon={<Strikethrough />} title="取り消し線" onClick={toggleStrike} />
            <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary" title="文字色">
              <Baseline className="h-4 w-4" />
              <input
                type="color" defaultValue="#000000"
                className="absolute h-0 w-0 opacity-0"
                onChange={(e) => fmt({ fill: e.target.value })}
              />
            </label>
            <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary" title="蛍光ペン (背景)">
              <Highlighter className="h-4 w-4" />
              <input
                type="color" defaultValue="#FFFF00"
                className="absolute h-0 w-0 opacity-0"
                onChange={(e) => canvas && applyStyle(canvas, { fill: e.target.value })}
              />
            </label>
          </div>
        </div>
      </RibbonGroup>

      <RibbonDivider />

      {/* 段落 */}
      <RibbonGroup label="段落">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-0.5">
            <RibbonIconButton icon={<List />} title="箇条書き" onClick={() => canvas && convertToUnorderedList(canvas)} />
            <RibbonIconButton icon={<ListOrdered />} title="段落番号" onClick={() => canvas && convertToUnorderedList(canvas)} />
            <RibbonIconButton icon={<IndentDecrease />} title="インデントを減らす" onClick={() => canvas && setLineHeight(canvas, 1.2)} />
            <RibbonIconButton icon={<IndentIncrease />} title="インデントを増やす" onClick={() => canvas && setLineHeight(canvas, 2.0)} />
          </div>
          <div className="flex items-center gap-0.5">
            <RibbonIconButton icon={<AlignLeft />} title="左揃え" onClick={() => fmt({ textAlign: "left" })} />
            <RibbonIconButton icon={<AlignCenter />} title="中央揃え" onClick={() => fmt({ textAlign: "center" })} />
            <RibbonIconButton icon={<AlignRight />} title="右揃え" onClick={() => fmt({ textAlign: "right" })} />
            <RibbonIconButton icon={<AlignJustify />} title="両端揃え" onClick={() => fmt({ textAlign: "justify" })} />
            <RibbonIconButton icon={<Rows3 />} title="行間 (広め)" onClick={() => canvas && setLineHeight(canvas, 1.6)} />
          </div>
        </div>
      </RibbonGroup>

      <RibbonDivider />

      {/* 図形描画 */}
      <RibbonGroup label="図形描画">
        <div className="flex items-center gap-0.5">
          <RibbonIconButton icon={<BringToFront />} title="最前面へ移動" onClick={() => canvas && bringToFront(canvas)} />
          <RibbonIconButton icon={<SendToBack />} title="最背面へ移動" onClick={() => canvas && sendToBack(canvas)} />
          <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary" title="塗りつぶし">
            <PaintBucket className="h-4 w-4" />
            <input
              type="color" defaultValue="#4A90E2"
              className="absolute h-0 w-0 opacity-0"
              onChange={(e) => canvas && applyStyle(canvas, { fill: e.target.value })}
            />
          </label>
          <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary" title="線の色">
            <SquareIcon className="h-4 w-4" />
            <input
              type="color" defaultValue="#333333"
              className="absolute h-0 w-0 opacity-0"
              onChange={(e) => canvas && applyStyle(canvas, { stroke: e.target.value, strokeWidth: 2 })}
            />
          </label>
        </div>
      </RibbonGroup>

      <RibbonDivider />

      {/* 編集 */}
      <RibbonGroup label="編集">
        <RibbonIconButton
          icon={<MousePointerClick />} title="すべて選択"
          onClick={() => {
            if (!canvas) return;
            canvas.discardActiveObject();
            const objs = canvas.getObjects();
            if (objs.length === 0) return;
            if (objs.length === 1) {
              canvas.setActiveObject(objs[0]);
            } else {
              canvas.setActiveObject(new ActiveSelection(objs, { canvas }));
            }
            canvas.requestRenderAll();
          }}
        />
      </RibbonGroup>
    </div>
  );
}
