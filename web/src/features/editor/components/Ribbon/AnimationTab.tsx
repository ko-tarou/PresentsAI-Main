"use client";
import { useState } from "react";
import { Square, Sparkles, ArrowRightToLine, ArrowDownToLine, Play } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { animateEntrance, type EntranceType } from "@lib/fabric/animation";

import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

type AnimChoice = "none" | EntranceType;

const ANIMATIONS: { type: AnimChoice; label: string; icon: React.ReactNode }[] = [
  { type: "none", label: "なし", icon: <Square /> },
  { type: "fade-in", label: "フェードイン", icon: <Sparkles /> },
  { type: "fly-in-left", label: "スライドイン", icon: <ArrowRightToLine /> },
  { type: "bounce", label: "バウンス", icon: <ArrowDownToLine /> },
];

export function AnimationTab() {
  const { canvas } = useEditorStore();
  const [selected, setSelected] = useState<AnimChoice>("none");

  function apply(type: AnimChoice) {
    setSelected(type);
    if (type === "none" || !canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) void animateEntrance(canvas, obj, type);
  }

  function preview() {
    if (selected === "none" || !canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) void animateEntrance(canvas, obj, selected);
  }

  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup label="アニメーション">
        <div className="flex items-center gap-0.5">
          {ANIMATIONS.map((a) => (
            <RibbonBigButton
              key={a.type}
              icon={a.icon}
              label={a.label}
              active={selected === a.type}
              onClick={() => apply(a.type)}
              disabled={!canvas}
              title={`${a.label} — 選択中のオブジェクトに適用`}
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
          disabled={!canvas || selected === "none"}
          title="選択したアニメーションを再生"
        />
      </RibbonGroup>
    </div>
  );
}
