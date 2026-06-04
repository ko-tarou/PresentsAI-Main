"use client";
import { useState } from "react";
import { Square, Sparkles, ArrowLeftToLine, ArrowRightToLine, ZoomIn, Play } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { playTransition, type TransitionType } from "@lib/fabric/animation";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

const TRANSITIONS: { type: TransitionType; label: string; icon: React.ReactNode }[] = [
  { type: "none", label: "なし", icon: <Square /> },
  { type: "fade", label: "フェード", icon: <Sparkles /> },
  { type: "slide-left", label: "スライド左", icon: <ArrowLeftToLine /> },
  { type: "slide-right", label: "スライド右", icon: <ArrowRightToLine /> },
  { type: "zoom", label: "ズーム", icon: <ZoomIn /> },
];

export function TransitionTab() {
  const [selected, setSelected] = useState<TransitionType>("none");

  function preview() {
    const el = useEditorStore.getState().canvas?.wrapperEl?.parentElement;
    if (el) void playTransition(el, selected);
  }

  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup label="画面切り替え">
        <div className="flex items-center gap-0.5">
          {TRANSITIONS.map((t) => (
            <RibbonBigButton
              key={t.type}
              icon={t.icon}
              label={t.label}
              active={selected === t.type}
              onClick={() => setSelected(t.type)}
            />
          ))}
        </div>
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="プレビュー">
        <RibbonBigButton
          icon={<Play />}
          label="プレビュー"
          onClick={preview}
          disabled={selected === "none"}
          title="選択した画面切り替えを再生"
        />
      </RibbonGroup>
    </div>
  );
}
