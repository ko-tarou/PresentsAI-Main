import type { Canvas } from "fabric";
import {
  animateEntrance,
  animateExit,
  type EntranceType,
  type ExitType,
  type TransitionType,
} from "./animation";
import { findObjectById } from "./objectId";
import type {
  ElementAnimation,
  ElementAnimationType,
  SlideTransition,
  SlideTransitionType,
} from "@shared/types/slide";

/**
 * Bridge between the persisted slide model (transition / animations) and the
 * preview-level playback primitives in ./animation. The editor stores model
 * types ("slide", "fadeIn", ...); playback maps them back to the preview types
 * the animation helpers understand and runs them in order.
 */

/** Map a persisted slide transition type to a preview transition type. */
export function modelTransitionToPreview(t: SlideTransitionType | undefined): TransitionType {
  switch (t) {
    case "fade": return "fade";
    case "slide": return "slide-left";
    case "push": return "slide-right";
    case "zoom": return "zoom";
    default: return "none"; // "none" or undefined
  }
}

/**
 * Map a persisted element animation type to a preview entrance type. Playback
 * always plays an entrance when a slide appears, so the "Out" variants reuse
 * the matching entrance motion (the editor only ever writes the "In" variants).
 */
export function modelAnimationToEntrance(t: ElementAnimationType): EntranceType {
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
  }
}

/** True for the "Out" element animation types (those that exit the slide). */
export function isExitAnimation(t: ElementAnimationType): boolean {
  return t === "fadeOut" || t === "slideOut" || t === "zoomOut";
}

/**
 * Map a persisted "Out" element animation type to a preview exit type. Returns
 * undefined for "In" / bounce types, which are entrance motions and have no
 * exit form. This is the symmetric counterpart of modelAnimationToEntrance.
 */
export function modelAnimationToExit(t: ElementAnimationType): ExitType | undefined {
  switch (t) {
    case "fadeOut": return "fade-out";
    case "slideOut": return "fly-out-left";
    case "zoomOut": return "zoom-out";
    default: return undefined; // fadeIn / slideIn / zoomIn / bounce are entrances
  }
}

/** True when the slide has a transition that should actually animate. */
export function hasTransition(transition: SlideTransition | undefined): boolean {
  return modelTransitionToPreview(transition?.type) !== "none";
}

const DEFAULT_ENTRANCE_MS = 600;

/**
 * Play every element animation for a slide on its canvas, in ascending `order`.
 * Each animation honors its own delayMs before starting. Animations whose
 * target object is missing (e.g. it was deleted) are skipped. Resolves once all
 * animations have finished.
 */
export async function playSlideAnimations(
  canvas: Canvas,
  animations: ElementAnimation[] | undefined,
): Promise<void> {
  if (!animations || animations.length === 0) return;
  const ordered = [...animations].sort((a, b) => a.order - b.order);
  await Promise.all(
    ordered.map(async (anim) => {
      const obj = findObjectById(canvas, anim.targetId);
      if (!obj) return;
      if (anim.delayMs && anim.delayMs > 0) await delay(anim.delayMs);
      await animateEntrance(
        canvas,
        obj,
        modelAnimationToEntrance(anim.type),
        anim.durationMs ?? DEFAULT_ENTRANCE_MS,
      );
    }),
  );
}

/**
 * Play every exit ("Out") element animation for a slide on its canvas, in
 * ascending `order`. Symmetric to playSlideAnimations: it filters to the exit
 * variants, honors each animation's delayMs, skips missing targets, and runs
 * the matching animateExit primitive. Resolves once all exits have finished.
 * Entrance / bounce animations are ignored here.
 */
export async function playSlideExitAnimations(
  canvas: Canvas,
  animations: ElementAnimation[] | undefined,
): Promise<void> {
  if (!animations || animations.length === 0) return;
  const exits = animations
    .filter((a) => isExitAnimation(a.type))
    .sort((a, b) => a.order - b.order);
  await Promise.all(
    exits.map(async (anim) => {
      const exitType = modelAnimationToExit(anim.type);
      if (!exitType) return;
      const obj = findObjectById(canvas, anim.targetId);
      if (!obj) return;
      if (anim.delayMs && anim.delayMs > 0) await delay(anim.delayMs);
      await animateExit(canvas, obj, exitType, anim.durationMs ?? DEFAULT_ENTRANCE_MS);
    }),
  );
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
