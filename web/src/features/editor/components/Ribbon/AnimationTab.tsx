"use client";
import { useState, useEffect } from "react";
import { Square, Sparkles, ArrowRightToLine, ArrowDownToLine, ZoomIn, Play } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { animateEntrance, type EntranceType } from "@lib/fabric/animation";
import { ensureObjectId } from "@lib/fabric/objectId";
import type { ElementAnimation, ElementAnimationType } from "@shared/types/slide";

import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

type AnimChoice = "none" | EntranceType;

const ANIMATION_DURATION_MS = 600;

const ANIMATIONS: { type: AnimChoice; label: string; icon: React.ReactNode }[] = [
  { type: "none", label: "なし", icon: <Square /> },
  { type: "fade-in", label: "フェードイン", icon: <Sparkles /> },
  { type: "fly-in-left", label: "スライドイン", icon: <ArrowRightToLine /> },
  { type: "zoom-in", label: "ズームイン", icon: <ZoomIn /> },
  { type: "bounce", label: "バウンス", icon: <ArrowDownToLine /> },
];

// Map the preview-level entrance to the persisted model animation type. Each
// entrance now has a matching model type, so the stored type reflects the motion
// actually played (no more "bounce stored as zoomIn" mismatch).
export function toModelAnimation(t: EntranceType): ElementAnimationType {
  switch (t) {
    case "fade-in": return "fadeIn";
    case "fly-in-left": return "slideIn";
    case "zoom-in": return "zoomIn";
    case "bounce": return "bounce";
  }
}

// Reverse mapping: restore the UI selection from a persisted model animation
// type so the tab reflects what is already applied to the selected object.
// The "Out" variants reuse the matching entrance choice because the editor
// only ever writes the "In" variants (see playback in slidePlayback.ts).
export function fromModelAnimation(t: ElementAnimationType | undefined): AnimChoice {
  switch (t) {
    case "fadeIn":
    case "fadeOut":
      return "fade-in";
    case "slideIn":
    case "slideOut":
      return "fly-in-left";
    case "zoomIn":
    case "zoomOut":
      return "zoom-in";
    case "bounce":
      return "bounce";
    default:
      return "none";
  }
}

// Resolve a stable target id for an active object. Unlike the object's index
// (which shifts on add/remove/reorder), this id is persisted with the object
// and survives save/load, so playback can reliably find the same element.
function targetIdFor(_canvas: NonNullable<ReturnType<typeof useEditorStore.getState>["canvas"]>, obj: object): string | null {
  return ensureObjectId(obj as Parameters<typeof ensureObjectId>[0]);
}

export function AnimationTab() {
  const { canvas, activeSlideId, presentationId } = useEditorStore();
  const { slides, updateSlideMeta } = useSlideStore();
  const { accessToken } = useAuthStore();
  const [selected, setSelected] = useState<AnimChoice>("none");

  // Reflect the saved animation of whatever object is currently selected, the
  // same way TransitionTab reflects the active slide's transition. Without this
  // the tab always showed "none" even when the object already had an animation.
  useEffect(() => {
    if (!canvas) return;
    const sync = () => {
      const obj = canvas.getActiveObject();
      if (!obj) {
        setSelected("none");
        return;
      }
      const id = (obj as { id?: string }).id;
      const anims = slides.find((s) => s.id === activeSlideId)?.animations ?? [];
      const match = id ? anims.find((a) => a.targetId === id) : undefined;
      setSelected(fromModelAnimation(match?.type));
    };
    sync();
    canvas.on("selection:created", sync);
    canvas.on("selection:updated", sync);
    canvas.on("selection:cleared", sync);
    return () => {
      canvas.off("selection:created", sync);
      canvas.off("selection:updated", sync);
      canvas.off("selection:cleared", sync);
    };
  }, [canvas, activeSlideId, slides]);

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
