"use client";
import { useState } from "react";
import { HomeTab } from "./HomeTab";
import { InsertTab } from "./InsertTab";
import { DesignTab } from "./DesignTab";
import { TransitionTab } from "./TransitionTab";
import { ViewTab } from "./ViewTab";
import { usePenTool } from "../../hooks/usePenTool";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

type TabKey = "home" | "insert" | "design" | "transition" | "view";
const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "ホーム" },
  { key: "insert", label: "挿入" },
  { key: "design", label: "デザイン" },
  { key: "transition", label: "画面切り替え" },
  { key: "view", label: "表示" },
];

export function Ribbon() {
  const [tab, setTab] = useState<TabKey>("home");
  usePenTool();
  useKeyboardShortcuts();
  return (
    <div className="shrink-0 border-b border-border bg-surface">
      {/* Tab strip */}
      <div className="flex items-center gap-1 px-2 pt-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={
              "rounded-t-md px-3 py-1.5 text-[13px] font-medium transition-colors " +
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
        {tab === "design" && <DesignTab />}
        {tab === "transition" && <TransitionTab />}
        {tab === "view" && <ViewTab />}
      </div>
    </div>
  );
}
