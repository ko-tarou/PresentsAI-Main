"use client";
import { useState } from "react";
import { Square, Sparkles, ArrowRightToLine, ArrowDownToLine, Play } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { animateEntrance, type EntranceType } from "@lib/fabric/animation";
import type { ElementAnimation, ElementAnimationType } from "@shared/types/slide";

import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

type AnimChoice = "none" | EntranceType;

const ANIMATION_DURATION_MS = 600;

const ANIMATIONS: { type: AnimChoice; label: string; icon: React.ReactNode }[] = [
  { type: "none", label: "なし", icon: <Square /> },
  { type: "fade-in", label: "フェードイン", icon: <Sparkles /> },
  { type: "fly-in-left", label: "スライドイン", icon: <ArrowRightToLine /> },
  { type: "bounce", label: "バウンス", icon: <ArrowDownToLine /> },
];

// Map the preview-level entrance to the persisted model animation type.
// "bounce" has no model equivalent yet and stores as the closest entrance.
export function toModelAnimation(t: EntranceType): ElementAnimationType {
  switch (t) {
    case "fade-in": return "fadeIn";
    case "fly-in-left": return "slideIn";
    case "bounce": return "zoomIn";
  }
}

// Resolve a stable target id for an active object: its index in the canvas
// object list. Playback (next PR) reads this back from the saved animation.
function targetIdFor(canvas: NonNullable<ReturnType<typeof useEditorStore.getState>["canvas"]>, obj: object): string | null {
  const idx = canvas.getObjects().indexOf(obj as never);
  return idx >= 0 ? String(idx) : null;
}

export function AnimationTab() {
  const { canvas, activeSlideId, presentationId } = useEditorStore();
  const { slides, updateSlideMeta } = useSlideStore();
  const { accessToken } = useAuthStore();
  const [selected, setSelected] = useState<AnimChoice>("none");

  async function apply(type: AnimChoice) {
    setSelected(type);
    if (type === "none" || !canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    void animateEntrance(canvas, obj, type);

    if (!activeSlideId) return;
    const targetId = targetIdFor(canvas, obj);
    if (targetId === null) return;

    // Replace any existing animation for this target, keep order ascending.
    const existing = slides.find((s) => s.id === activeSlideId)?.animations ?? [];
    const others = existing.filter((a) => a.targetId !== targetId);
    const next: ElementAnimation = {
      targetId,
      type: toModelAnimation(type),
      order: others.length,
      durationMs: ANIMATION_DURATION_MS,
    };
    const animations = [...others, next];
    updateSlideMeta(activeSlideId, { animations });
    if (accessToken && presentationId) {
      await slidesApi.updateMeta(accessToken, presentationId, activeSlideId, { animations });
    }
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
              onClick={() => void apply(a.type)}
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
