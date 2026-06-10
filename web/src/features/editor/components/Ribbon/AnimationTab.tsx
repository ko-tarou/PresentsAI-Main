"use client";
import { useState, useEffect } from "react";
import { Square, Sparkles, ArrowRightToLine, ArrowLeftToLine, ArrowDownToLine, ZoomIn, ZoomOut, Play } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { animateEntrance, animateExit, type EntranceType, type ExitType } from "@lib/fabric/animation";
import { ensureObjectId } from "@lib/fabric/objectId";
import { isExitAnimation } from "@lib/fabric/slidePlayback";
import type { ElementAnimation, ElementAnimationType } from "@shared/types/slide";

import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

type AnimChoice = "none" | EntranceType;
type ExitChoice = "none" | ExitType;

const ANIMATION_DURATION_MS = 600;

const ANIMATIONS: { type: AnimChoice; label: string; icon: React.ReactNode }[] = [
  { type: "none", label: "なし", icon: <Square /> },
  { type: "fade-in", label: "フェードイン", icon: <Sparkles /> },
  { type: "fly-in-left", label: "スライドイン", icon: <ArrowRightToLine /> },
  { type: "zoom-in", label: "ズームイン", icon: <ZoomIn /> },
  { type: "bounce", label: "バウンス", icon: <ArrowDownToLine /> },
];

// Exit ("Out") motions. Symmetric to ANIMATIONS but for退場. There is no exit
// counterpart for bounce, so the set is fade / slide / zoom only.
const EXIT_ANIMATIONS: { type: ExitChoice; label: string; icon: React.ReactNode }[] = [
  { type: "none", label: "なし", icon: <Square /> },
  { type: "fade-out", label: "フェードアウト", icon: <Sparkles /> },
  { type: "fly-out-left", label: "スライドアウト", icon: <ArrowLeftToLine /> },
  { type: "zoom-out", label: "ズームアウト", icon: <ZoomOut /> },
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
// Only entrance ("In") + bounce types produce an entrance selection; exit
// ("Out") types are authored separately (see fromModelExit) and return "none"
// here so the entrance picker is not falsely highlighted.
export function fromModelAnimation(t: ElementAnimationType | undefined): AnimChoice {
  switch (t) {
    case "fadeIn":
      return "fade-in";
    case "slideIn":
      return "fly-in-left";
    case "zoomIn":
      return "zoom-in";
    case "bounce":
      return "bounce";
    default:
      return "none";
  }
}

// Map the preview-level exit choice to the persisted model animation type.
// Symmetric counterpart of toModelAnimation for退場.
export function toModelExit(t: ExitType): ElementAnimationType {
  switch (t) {
    case "fade-out": return "fadeOut";
    case "fly-out-left": return "slideOut";
    case "zoom-out": return "zoomOut";
  }
}

// Restore the exit-picker selection from a persisted model animation type.
// Entrance / bounce types are not exits, so they map to "none".
export function fromModelExit(t: ElementAnimationType | undefined): ExitChoice {
  switch (t) {
    case "fadeOut": return "fade-out";
    case "slideOut": return "fly-out-left";
    case "zoomOut": return "zoom-out";
    default: return "none";
  }
}

// Resolve a stable target id for an active object. Unlike the object's index
// (which shifts on add/remove/reorder), this id is persisted with the object
// and survives save/load, so playback can reliably find the same element.
function targetIdFor(_canvas: NonNullable<ReturnType<typeof useEditorStore.getState>["canvas"]>, obj: object): string | null {
  return ensureObjectId(obj as Parameters<typeof ensureObjectId>[0]);
}

/** Which animation slot of an element an authoring edit targets. */
export type AnimationSlot = "entrance" | "exit";

// True when an animation belongs to the given slot. An element may hold one
// entrance and one exit; slot matching keeps the two independent so authoring
// an exit never clobbers the entrance (and vice-versa).
function inSlot(a: ElementAnimation, slot: AnimationSlot): boolean {
  return slot === "exit" ? isExitAnimation(a.type) : !isExitAnimation(a.type);
}

/**
 * Replace (or insert) the animation occupying `slot` for `targetId`, merging the
 * given patch onto it. The other slot of the same target and every other target
 * are preserved untouched. A fresh entrance defaults to fade-in; a fresh exit
 * to fade-out. New animations are appended at the end of the play order.
 */
export function upsertAnimation(
  existing: ElementAnimation[],
  targetId: string,
  patch: Partial<Omit<ElementAnimation, "targetId">>,
  slot: AnimationSlot = "entrance",
): ElementAnimation[] {
  // Keep everything except the one animation in this target's slot.
  const others = existing.filter((a) => !(a.targetId === targetId && inSlot(a, slot)));
  const current = existing.find((a) => a.targetId === targetId && inSlot(a, slot));
  const base: ElementAnimation = current ?? {
    targetId,
    type: slot === "exit" ? "fadeOut" : "fadeIn",
    order: existing.length,
    durationMs: ANIMATION_DURATION_MS,
  };
  return [...others, { ...base, ...patch, targetId }];
}

/**
 * Remove the animation occupying `slot` for `targetId` (used when the user picks
 * "なし"). Other slots / targets are left untouched.
 */
export function removeAnimation(
  existing: ElementAnimation[],
  targetId: string,
  slot: AnimationSlot,
): ElementAnimation[] {
  return existing.filter((a) => !(a.targetId === targetId && inSlot(a, slot)));
}

export function AnimationTab() {
  const { canvas, activeSlideId, presentationId } = useEditorStore();
  const { slides, updateSlideMeta } = useSlideStore();
  const { accessToken } = useAuthStore();
  const [selected, setSelected] = useState<AnimChoice>("none");
  const [exit, setExit] = useState<ExitChoice>("none");
  const [delayMs, setDelayMs] = useState(0);
  const [order, setOrder] = useState(0);
  const [exitDelayMs, setExitDelayMs] = useState(0);
  const [exitOrder, setExitOrder] = useState(0);

  // Reflect the saved entrance + exit animations of whatever object is currently
  // selected, the same way TransitionTab reflects the active slide's transition.
  // Entrance and exit are independent slots, so each is looked up separately.
  useEffect(() => {
    if (!canvas) return;
    const sync = () => {
      const obj = canvas.getActiveObject();
      const id = obj ? (obj as { id?: string }).id : undefined;
      const anims = slides.find((s) => s.id === activeSlideId)?.animations ?? [];
      const enter = id ? anims.find((a) => a.targetId === id && !isExitAnimation(a.type)) : undefined;
      const leave = id ? anims.find((a) => a.targetId === id && isExitAnimation(a.type)) : undefined;
      setSelected(fromModelAnimation(enter?.type));
      setDelayMs(enter?.delayMs ?? 0);
      setOrder(enter?.order ?? 0);
      setExit(fromModelExit(leave?.type));
      setExitDelayMs(leave?.delayMs ?? 0);
      setExitOrder(leave?.order ?? 0);
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

  function existingAnimations(): ElementAnimation[] {
    return slides.find((s) => s.id === activeSlideId)?.animations ?? [];
  }

  async function apply(type: AnimChoice) {
    setSelected(type);
    const targetId = activeTargetId();
    if (targetId === null) return;
    const existing = existingAnimations();
    if (type === "none") {
      await persist(removeAnimation(existing, targetId, "entrance"));
      return;
    }
    if (canvas) {
      const obj = canvas.getActiveObject();
      if (obj) void animateEntrance(canvas, obj, type);
    }
    await persist(upsertAnimation(existing, targetId, { type: toModelAnimation(type) }, "entrance"));
  }

  async function applyExit(type: ExitChoice) {
    setExit(type);
    const targetId = activeTargetId();
    if (targetId === null) return;
    const existing = existingAnimations();
    if (type === "none") {
      await persist(removeAnimation(existing, targetId, "exit"));
      return;
    }
    if (canvas) {
      const obj = canvas.getActiveObject();
      if (obj) void animateExit(canvas, obj, type);
    }
    await persist(upsertAnimation(existing, targetId, { type: toModelExit(type) }, "exit"));
  }

  // Update the timing (delay / play order) of the selected object's animation in
  // the given slot. upsert seeds a default motion if none exists yet so timing
  // can be authored before picking a motion.
  async function patchTiming(slot: AnimationSlot, patch: { delayMs?: number; order?: number }) {
    if (slot === "entrance") {
      if (patch.delayMs !== undefined) setDelayMs(patch.delayMs);
      if (patch.order !== undefined) setOrder(patch.order);
    } else {
      if (patch.delayMs !== undefined) setExitDelayMs(patch.delayMs);
      if (patch.order !== undefined) setExitOrder(patch.order);
    }
    const targetId = activeTargetId();
    if (targetId === null) return;
    await persist(upsertAnimation(existingAnimations(), targetId, patch, slot));
  }

  function preview() {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    if (selected !== "none") void animateEntrance(canvas, obj, selected);
    if (exit !== "none") void animateExit(canvas, obj, exit);
  }

  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup label="開始（入場）">
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

      <RibbonGroup label="終了（退場）">
        <div className="flex items-center gap-0.5">
          {EXIT_ANIMATIONS.map((a) => (
            <RibbonBigButton
              key={a.type}
              icon={a.icon}
              label={a.label}
              active={exit === a.type}
              onClick={() => void applyExit(a.type)}
              disabled={!canvas}
              title={`${a.label} — 選択中のオブジェクトに適用（スライド切替時に再生）`}
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
          disabled={!canvas || (selected === "none" && exit === "none")}
          title="選択した入場・退場アニメーションを再生"
        />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="入場タイミング">
        <div className="flex items-center gap-3 px-1">
          <TimingField
            label="遅延 (ms)"
            value={delayMs}
            min={0}
            step={100}
            disabled={!canvas || selected === "none"}
            onCommit={(v) => void patchTiming("entrance", { delayMs: v })}
            title="再生開始までの待ち時間（ミリ秒）"
          />
          <TimingField
            label="順序"
            value={order}
            min={0}
            step={1}
            disabled={!canvas || selected === "none"}
            onCommit={(v) => void patchTiming("entrance", { order: v })}
            title="スライド内での再生順（小さいほど先に再生）"
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="退場タイミング">
        <div className="flex items-center gap-3 px-1">
          <TimingField
            label="遅延 (ms)"
            value={exitDelayMs}
            min={0}
            step={100}
            disabled={!canvas || exit === "none"}
            onCommit={(v) => void patchTiming("exit", { delayMs: v })}
            title="退場再生開始までの待ち時間（ミリ秒）"
          />
          <TimingField
            label="順序"
            value={exitOrder}
            min={0}
            step={1}
            disabled={!canvas || exit === "none"}
            onCommit={(v) => void patchTiming("exit", { order: v })}
            title="退場の再生順（小さいほど先に再生）"
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
