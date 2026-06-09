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

/**
 * Replace (or insert) the animation for `targetId` in `existing`, merging the
 * given patch onto it. Order/delay authoring edits go through here so the rest
 * of the list is preserved and the target keeps a single animation. A fresh
 * animation defaults to a fade-in entrance at the end of the play order.
 */
export function upsertAnimation(
  existing: ElementAnimation[],
  targetId: string,
  patch: Partial<Omit<ElementAnimation, "targetId">>,
): ElementAnimation[] {
  const others = existing.filter((a) => a.targetId !== targetId);
  const current = existing.find((a) => a.targetId === targetId);
  const base: ElementAnimation = current ?? {
    targetId,
    type: "fadeIn",
    order: others.length,
    durationMs: ANIMATION_DURATION_MS,
  };
  return [...others, { ...base, ...patch, targetId }];
}

export function AnimationTab() {
  const { canvas, activeSlideId, presentationId } = useEditorStore();
  const { slides, updateSlideMeta } = useSlideStore();
  const { accessToken } = useAuthStore();
  const [selected, setSelected] = useState<AnimChoice>("none");
  const [delayMs, setDelayMs] = useState(0);
  const [order, setOrder] = useState(0);

  // Reflect the saved animation of whatever object is currently selected, the
  // same way TransitionTab reflects the active slide's transition. Without this
  // the tab always showed "none" even when the object already had an animation.
  useEffect(() => {
    if (!canvas) return;
    const sync = () => {
      const obj = canvas.getActiveObject();
      if (!obj) {
        setSelected("none");
        setDelayMs(0);
        setOrder(0);
        return;
      }
      const id = (obj as { id?: string }).id;
      const anims = slides.find((s) => s.id === activeSlideId)?.animations ?? [];
      const match = id ? anims.find((a) => a.targetId === id) : undefined;
      setSelected(fromModelAnimation(match?.type));
      setDelayMs(match?.delayMs ?? 0);
      setOrder(match?.order ?? 0);
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

  // Persist an updated animation list to the store and (if signed in) the API.
  async function persist(animations: ElementAnimation[]) {
    if (!activeSlideId) return;
    updateSlideMeta(activeSlideId, { animations });
    if (accessToken && presentationId) {
      await slidesApi.updateMeta(accessToken, presentationId, activeSlideId, { animations });
    }
  }

  // Stable target id of the active object, or null if nothing is selected.
  function activeTargetId(): string | null {
    if (!canvas) return null;
    const obj = canvas.getActiveObject();
    if (!obj) return null;
    return targetIdFor(canvas, obj);
  }

  async function apply(type: AnimChoice) {
    setSelected(type);
    if (type === "none" || !canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    void animateEntrance(canvas, obj, type);

    const targetId = activeTargetId();
    if (targetId === null) return;
    const existing = slides.find((s) => s.id === activeSlideId)?.animations ?? [];
    await persist(upsertAnimation(existing, targetId, { type: toModelAnimation(type) }));
  }

  // Update the timing (delay / play order) of the selected object's animation.
  // Only meaningful once an animation exists; upsert seeds a fade-in otherwise
  // so timing can be authored before picking a motion.
  async function patchTiming(patch: { delayMs?: number; order?: number }) {
    if (patch.delayMs !== undefined) setDelayMs(patch.delayMs);
    if (patch.order !== undefined) setOrder(patch.order);
    const targetId = activeTargetId();
    if (targetId === null) return;
    const existing = slides.find((s) => s.id === activeSlideId)?.animations ?? [];
    await persist(upsertAnimation(existing, targetId, patch));
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
      <RibbonDivider />

      <RibbonGroup label="タイミング">
        <div className="flex items-center gap-3 px-1">
          <TimingField
            label="遅延 (ms)"
            value={delayMs}
            min={0}
            step={100}
            disabled={!canvas || selected === "none"}
            onCommit={(v) => void patchTiming({ delayMs: v })}
            title="再生開始までの待ち時間（ミリ秒）"
          />
          <TimingField
            label="順序"
            value={order}
            min={0}
            step={1}
            disabled={!canvas || selected === "none"}
            onCommit={(v) => void patchTiming({ order: v })}
            title="スライド内での再生順（小さいほど先に再生）"
          />
        </div>
      </RibbonGroup>
    </div>
  );
}

// A compact labeled number input used for animation timing (delay / order).
// Commits on change; clamps to `min` so negative values can't be persisted.
function TimingField({
  label, value, min, step, disabled, onCommit, title,
}: {
  label: string;
  value: number;
  min: number;
  step: number;
  disabled?: boolean;
  onCommit: (value: number) => void;
  title?: string;
}) {
  return (
    <label className="flex flex-col items-start gap-0.5" title={title}>
      <span className="text-[10px] leading-none text-[#605E5C]">{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          onCommit(Number.isFinite(n) ? Math.max(min, n) : min);
        }}
        className="h-7 w-16 rounded border border-border bg-white px-1.5 text-xs text-content-primary disabled:opacity-40"
      />
    </label>
  );
}
