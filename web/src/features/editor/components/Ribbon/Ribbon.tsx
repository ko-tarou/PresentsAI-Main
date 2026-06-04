"use client";
import { useState } from "react";
import { HomeTab } from "./HomeTab";
import { InsertTab } from "./InsertTab";
import { DrawTab } from "./DrawTab";
import { DesignTab } from "./DesignTab";
import { TransitionTab } from "./TransitionTab";
import { AnimationTab } from "./AnimationTab";
import { SlideShowTab } from "./SlideShowTab";
import { ReviewTab } from "./ReviewTab";
import { ViewTab } from "./ViewTab";
import { Backstage } from "../Backstage";
import { usePenTool } from "../../hooks/usePenTool";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

type TabKey =
  | "home" | "insert" | "draw" | "design" | "transition"
  | "animation" | "slideshow" | "review" | "view";

// PowerPoint tab order.
const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "ホーム" },
  { key: "insert", label: "挿入" },
  { key: "draw", label: "描画" },
  { key: "design", label: "デザイン" },
  { key: "transition", label: "画面切り替え" },
  { key: "animation", label: "アニメーション" },
  { key: "slideshow", label: "スライドショー" },
  { key: "review", label: "校閲" },
  { key: "view", label: "表示" },
];

export function Ribbon() {
  const [tab, setTab] = useState<TabKey>("home");
  const [backstageOpen, setBackstageOpen] = useState(false);
  usePenTool();
  useKeyboardShortcuts();
  return (
    <div className="shrink-0 border-b border-border bg-surface">
      <Backstage open={backstageOpen} onClose={() => setBackstageOpen(false)} />
      {/* Tab strip — allow horizontal scroll if the 9 tabs exceed the width */}
      <div className="flex items-center gap-1 overflow-x-auto px-2 pt-1">
        <button onClick={() => setBackstageOpen(true)}
          className="shrink-0 rounded-t-md bg-primary-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-primary-700">
          ファイル
        </button>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={
              "shrink-0 rounded-t-md px-3 py-1.5 text-[13px] font-medium transition-colors " +
              (tab === t.key
                ? "bg-surface-subtle text-primary-700 border-b-2 border-primary-600"
                : "text-content-secondary hover:bg-surface-muted hover:text-content-primary")
            }>
            {t.label}
          </button>
        ))}
      </div>
      {/* Active panel */}
      <div className="flex h-[88px] items-stretch bg-surface-subtle px-2 py-1 overflow-x-auto">
        {tab === "home" && <HomeTab />}
        {tab === "insert" && <InsertTab />}
        {tab === "draw" && <DrawTab />}
        {tab === "design" && <DesignTab />}
        {tab === "transition" && <TransitionTab />}
        {tab === "animation" && <AnimationTab />}
        {tab === "slideshow" && <SlideShowTab />}
        {tab === "review" && <ReviewTab />}
        {tab === "view" && <ViewTab />}
      </div>
    </div>
  );
}
