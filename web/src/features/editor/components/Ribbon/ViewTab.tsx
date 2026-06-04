"use client";
import { useRef, useState } from "react";
import { Monitor, Grid3x3, LayoutGrid, Ruler, Magnet, Maximize } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { toggleGrid, enableSnap } from "@lib/fabric/grid";
import { fitToContainer } from "@lib/fabric/canvas";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

export function ViewTab() {
  const { canvas, setZoom } = useEditorStore();
  const [grid, setGrid] = useState(false);
  const [snap, setSnap] = useState(false);
  const snapEnabled = useRef(false);

  function onToggleGrid() {
    if (!canvas) return;
    const next = !grid;
    toggleGrid(canvas, next);
    setGrid(next);
  }

  function onToggleSnap() {
    if (!canvas) return;
    // enableSnap registers a listener with no removal API; register at most once.
    if (!snapEnabled.current) {
      enableSnap(canvas);
      snapEnabled.current = true;
    }
    setSnap((s) => !s);
  }

  function fit() {
    if (!canvas) return;
    const el = canvas.wrapperEl?.parentElement;
    if (el) setZoom(fitToContainer(canvas, el.clientWidth));
  }

  return (
    <div className="flex h-full items-stretch">
      {/* Presentation views */}
      <RibbonGroup label="プレゼンテーション表示">
        <RibbonBigButton icon={<Monitor />} label="標準" active title="標準表示" />
        <RibbonBigButton
          icon={<LayoutGrid />}
          label="スライド一覧"
          title="スライド一覧 — 次のアップデートで実装"
        />
      </RibbonGroup>
      <RibbonDivider />

      {/* Show toggles */}
      <RibbonGroup label="表示">
        <RibbonBigButton icon={<Grid3x3 />} label="グリッド線" active={grid} onClick={onToggleGrid} />
        <RibbonBigButton icon={<Magnet />} label="スナップ" active={snap} onClick={onToggleSnap} />
        <RibbonBigButton icon={<Ruler />} label="ルーラー" title="ルーラー — 次のアップデートで実装" />
      </RibbonGroup>
      <RibbonDivider />

      {/* Zoom */}
      <RibbonGroup label="ズーム">
        <RibbonBigButton icon={<Maximize />} label="ウィンドウに合わせる" onClick={fit} disabled={!canvas} />
      </RibbonGroup>
    </div>
  );
}
