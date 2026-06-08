import { Canvas } from "fabric";
import { applyControlsToCanvas, applyPowerPointControls } from "./powerpointControls";
import { ensureObjectIds, CUSTOM_OBJECT_PROPERTIES } from "./objectId";

// Apply PowerPoint-style selection/resize defaults once at module load.
applyPowerPointControls();

export interface CanvasOptions {
  width: number;
  height: number;
  backgroundColor: string;
}

export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export function createCanvas(el: HTMLCanvasElement, opts?: Partial<CanvasOptions>): Canvas {
  applyPowerPointControls();
  const canvas = new Canvas(el, {
    width: opts?.width ?? SLIDE_WIDTH,
    height: opts?.height ?? SLIDE_HEIGHT,
    backgroundColor: opts?.backgroundColor ?? "#ffffff",
    selection: true,
    preserveObjectStacking: true,
    // PowerPoint: dragging a corner scales freely by default, and holding Shift
    // constrains to uniform (aspect-locked) scaling. Fabric v6 defaults to the
    // opposite (uniform by default, Shift = free), so flip it here.
    uniformScaling: false,
  });
  return canvas;
}

export function loadFromJSON(canvas: Canvas, json: object): Promise<Canvas> {
  return canvas.loadFromJSON(json).then((c) => {
    // Re-apply PowerPoint object behaviors to restored objects so saved slides
    // behave like freshly created ones (uniform stroke, no-distort textboxes).
    applyControlsToCanvas(c);
    // Back-fill stable ids on slides saved before object ids existed, so their
    // element animations can still resolve their target objects.
    ensureObjectIds(c);
    c.renderAll();
    return c;
  });
}

export function toJSON(canvas: Canvas): Record<string, unknown> {
  // Assign ids to any object lacking one before serializing, then include the
  // `id` custom property so the stable identity round-trips through save/load.
  ensureObjectIds(canvas);
  // toObject threads `propertiesToInclude` down to each object's serializer,
  // so the custom `id` is emitted. Canvas.toJSON() in fabric v6 takes no args.
  return canvas.toObject([...CUSTOM_OBJECT_PROPERTIES]) as Record<string, unknown>;
}

export function fitToContainer(canvas: Canvas, containerWidth: number): number {
  const scale = containerWidth / SLIDE_WIDTH;
  canvas.setZoom(scale);
  canvas.setWidth(containerWidth);
  canvas.setHeight(SLIDE_HEIGHT * scale);
  canvas.renderAll();
  return scale;
}
