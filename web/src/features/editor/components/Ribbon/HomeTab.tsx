"use client";
import {
  Copy, Trash2,
  Bold, Italic, Underline, Strikethrough, ChevronUp, ChevronDown, Baseline, Highlighter,
  CaseSensitive, Superscript, Subscript, MoveHorizontal, Sparkles,
  List, ListOrdered, IndentDecrease, IndentIncrease,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Rows3, AlignVerticalSpaceAround,
  Columns3, TextSelect,
  BringToFront, SendToBack, PaintBucket, Square as SquareIcon,
  MousePointerClick,
} from "lucide-react";
import { IText, ActiveSelection } from "fabric";
import { useEditorStore } from "../../stores/editorStore";
import { applyTextFormat } from "@lib/fabric/tools/text";
import { applyStyle } from "@lib/fabric/tools/style";
import { convertToUnorderedList, setLineHeight, setLetterSpacing } from "@lib/fabric/tools/richText";
import {
  deleteSelected, duplicateSelected, bringToFront, sendToBack,
} from "@lib/fabric/tools/select";
import { RibbonGroup, RibbonDivider, RibbonIconButton } from "./ribbonPrimitives";
import { NewSlideButton } from "./NewSlideButton";
import { Popover } from "@shared/components/ui/Popover";

const FONT_FAMILIES = [
  "sans-serif", "serif", "monospace", "Arial", "Helvetica",
  "Georgia", "Times New Roman", "游ゴシック", "游明朝", "メイリオ",
];

const HIGHLIGHT_PRESETS = [
  { label: "黄", color: "#FFF275" },
  { label: "緑", color: "#B6F2C3" },
  { label: "シアン", color: "#A5E8F0" },
  { label: "ピンク", color: "#F7B6D2" },
];

const TEXT_SHADOW = { color: "rgba(0,0,0,0.45)", blur: 4, offsetX: 2, offsetY: 2 };

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// strip any of our known leading list markers from a line
function stripMarker(line: string): string {
  return line.replace(/^\s*(?:[•◦▪–]\s+|\d+[.)]\s+|[①②③④⑤⑥⑦⑧⑨⑩]\s+)/, "");
}

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

export function HomeTab() {
  const { canvas } = useEditorStore();

  function fmt(format: Parameters<typeof applyTextFormat>[1]) {
    if (canvas) applyTextFormat(canvas, format);
  }

  // run an op on the active IText object, then render
  function withText(fn: (o: IText) => void) {
    const obj = canvas?.getActiveObject();
    if (!canvas || !(obj instanceof IText)) return;
    fn(obj);
    canvas.requestRenderAll();
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
    withText((o) => o.set("linethrough", !o.linethrough));
  }

  function setHighlight(color: string) {
    withText((o) => o.set("textBackgroundColor", color));
  }

  function changeCase(mode: "upper" | "lower" | "title") {
    withText((o) => {
      const t = o.text ?? "";
      const next = mode === "upper" ? t.toUpperCase() : mode === "lower" ? t.toLowerCase() : toTitleCase(t);
      o.set("text", next);
    });
  }

  function scaleFontSize(factor: number) {
    withText((o) => o.set("fontSize", Math.max(8, Math.round((o.fontSize ?? 24) * factor))));
  }

  function toggleTextShadow() {
    const obj = canvas?.getActiveObject();
    if (!canvas || !(obj instanceof IText)) return;
    applyStyle(canvas, { shadow: obj.shadow ? null : TEXT_SHADOW });
  }

  // prefix each line with a chosen bullet marker (replacing any existing marker)
  function applyBulletMarker(marker: string) {
    withText((o) => {
      const lines = (o.text ?? "").split("\n");
      o.set("text", lines.map((l) => `${marker} ${stripMarker(l)}`).join("\n"));
    });
  }

  // number each line using the chosen numbering style
  function applyNumberStyle(style: "dot" | "paren" | "circled") {
    withText((o) => {
      const lines = (o.text ?? "").split("\n");
      o.set("text", lines.map((l, i) => {
        const body = stripMarker(l);
        if (style === "circled") return `${CIRCLED[i] ?? `${i + 1}.`} ${body}`;
        return `${i + 1}${style === "paren" ? ")" : "."} ${body}`;
      }).join("\n"));
    });
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
            {/* 大文字/小文字 */}
            <Popover
              trigger={({ toggle, ref }) => (
                <button ref={(el) => ref(el)} onClick={toggle} title="大文字/小文字"
                  className="flex h-7 w-7 items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary">
                  <CaseSensitive className="h-4 w-4" />
                </button>
              )}
            >
              {(close) => (
                <div className="flex w-44 flex-col p-1 text-[12px] text-content-primary">
                  <button className="rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { changeCase("upper"); close(); }}>大文字 (ABC)</button>
                  <button className="rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { changeCase("lower"); close(); }}>小文字 (abc)</button>
                  <button className="rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { changeCase("title"); close(); }}>各単語の先頭を大文字</button>
                </div>
              )}
            </Popover>
          </div>
          <div className="flex items-center gap-0.5">
            <RibbonIconButton icon={<Bold />} title="太字" onClick={() => fmt({ fontWeight: "bold" })} />
            <RibbonIconButton icon={<Italic />} title="斜体" onClick={() => fmt({ fontStyle: "italic" })} />
            <RibbonIconButton icon={<Underline />} title="下線" onClick={() => fmt({ underline: true })} />
            <RibbonIconButton icon={<Strikethrough />} title="取り消し線" onClick={toggleStrike} />
            <RibbonIconButton icon={<Superscript />} title="上付き" onClick={() => scaleFontSize(0.7)} />
            <RibbonIconButton icon={<Subscript />} title="下付き" onClick={() => scaleFontSize(0.7)} />
            <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary" title="文字色">
              <Baseline className="h-4 w-4" />
              <input
                type="color" defaultValue="#000000"
                className="absolute h-0 w-0 opacity-0"
                onChange={(e) => fmt({ fill: e.target.value })}
              />
            </label>
            {/* ハイライト (蛍光ペン) */}
            <Popover
              trigger={({ toggle, ref }) => (
                <button ref={(el) => ref(el)} onClick={toggle} title="蛍光ペン"
                  className="flex h-7 w-7 items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary">
                  <Highlighter className="h-4 w-4" />
                </button>
              )}
            >
              {(close) => (
                <div className="flex w-40 flex-col gap-1 p-2">
                  <div className="flex gap-1.5">
                    {HIGHLIGHT_PRESETS.map((p) => (
                      <button key={p.color} title={p.label}
                        className="h-6 w-6 rounded border border-border"
                        style={{ backgroundColor: p.color }}
                        onClick={() => { setHighlight(p.color); close(); }} />
                    ))}
                  </div>
                  <button className="rounded px-2 py-1 text-left text-[12px] text-content-secondary hover:bg-surface-muted"
                    onClick={() => { setHighlight(""); close(); }}>なし</button>
                </div>
              )}
            </Popover>
            {/* 文字の間隔 */}
            <Popover
              trigger={({ toggle, ref }) => (
                <button ref={(el) => ref(el)} onClick={toggle} title="文字の間隔"
                  className="flex h-7 w-7 items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary">
                  <MoveHorizontal className="h-4 w-4" />
                </button>
              )}
            >
              {(close) => (
                <div className="flex w-32 flex-col p-1 text-[12px] text-content-primary">
                  <button className="rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { canvas && setLetterSpacing(canvas, -1); close(); }}>狭く</button>
                  <button className="rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { canvas && setLetterSpacing(canvas, 0); close(); }}>標準</button>
                  <button className="rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { canvas && setLetterSpacing(canvas, 3); close(); }}>広く</button>
                </div>
              )}
            </Popover>
            <RibbonIconButton icon={<Sparkles />} title="文字の影" onClick={toggleTextShadow} />
          </div>
        </div>
      </RibbonGroup>

      <RibbonDivider />

      {/* 段落 */}
      <RibbonGroup label="段落">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-0.5">
            <RibbonIconButton icon={<List />} title="箇条書き" onClick={() => canvas && convertToUnorderedList(canvas)} />
            {/* 箇条書きスタイル */}
            <Popover
              trigger={({ toggle, ref }) => (
                <button ref={(el) => ref(el)} onClick={toggle} title="箇条書きスタイル"
                  className="flex h-7 w-7 items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary">
                  <List className="h-4 w-4" />
                </button>
              )}
            >
              {(close) => (
                <div className="grid w-28 grid-cols-2 gap-1 p-2 text-[14px] text-content-primary">
                  {["•", "◦", "▪", "–"].map((m) => (
                    <button key={m} className="rounded px-2 py-1 hover:bg-surface-muted"
                      onClick={() => { applyBulletMarker(m); close(); }}>{m}</button>
                  ))}
                </div>
              )}
            </Popover>
            <RibbonIconButton icon={<ListOrdered />} title="段落番号" onClick={() => canvas && convertToUnorderedList(canvas)} />
            {/* 番号スタイル */}
            <Popover
              trigger={({ toggle, ref }) => (
                <button ref={(el) => ref(el)} onClick={toggle} title="番号スタイル"
                  className="flex h-7 w-7 items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary">
                  <ListOrdered className="h-4 w-4" />
                </button>
              )}
            >
              {(close) => (
                <div className="flex w-28 flex-col p-1 text-[12px] text-content-primary">
                  <button className="rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { applyNumberStyle("dot"); close(); }}>1.</button>
                  <button className="rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { applyNumberStyle("paren"); close(); }}>1)</button>
                  <button className="rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { applyNumberStyle("circled"); close(); }}>①</button>
                </div>
              )}
            </Popover>
            <RibbonIconButton icon={<IndentDecrease />} title="インデントを減らす" onClick={() => canvas && setLineHeight(canvas, 1.2)} />
            <RibbonIconButton icon={<IndentIncrease />} title="インデントを増やす" onClick={() => canvas && setLineHeight(canvas, 2.0)} />
          </div>
          <div className="flex items-center gap-0.5">
            <RibbonIconButton icon={<AlignLeft />} title="左揃え" onClick={() => fmt({ textAlign: "left" })} />
            <RibbonIconButton icon={<AlignCenter />} title="中央揃え" onClick={() => fmt({ textAlign: "center" })} />
            <RibbonIconButton icon={<AlignRight />} title="右揃え" onClick={() => fmt({ textAlign: "right" })} />
            <RibbonIconButton icon={<AlignJustify />} title="両端揃え" onClick={() => fmt({ textAlign: "justify" })} />
            {/* 行間 */}
            <Popover
              trigger={({ toggle, ref }) => (
                <button ref={(el) => ref(el)} onClick={toggle} title="行間"
                  className="flex h-7 w-7 items-center justify-center rounded text-content-secondary hover:bg-surface-muted hover:text-content-primary">
                  <AlignVerticalSpaceAround className="h-4 w-4" />
                </button>
              )}
            >
              {(close) => (
                <div className="flex w-24 flex-col p-1 text-[12px] text-content-primary">
                  {[1.0, 1.15, 1.5, 2.0].map((v) => (
                    <button key={v} className="rounded px-2 py-1.5 text-left hover:bg-surface-muted"
                      onClick={() => { canvas && setLineHeight(canvas, v); close(); }}>{v.toFixed(2)}</button>
                  ))}
                </div>
              )}
            </Popover>
            <RibbonIconButton icon={<Rows3 />} title="行間 (広め)" onClick={() => canvas && setLineHeight(canvas, 1.6)} />
            <RibbonIconButton icon={<Columns3 />} title="次のアップデートで実装" />
            <RibbonIconButton icon={<TextSelect />} title="次のアップデートで実装" />
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
