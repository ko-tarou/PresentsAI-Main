import { Canvas } from "fabric";
import { applyControlsToCanvas, applyPowerPointControls } from "./powerpointControls";

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
  });
  return canvas;
}

export function loadFromJSON(canvas: Canvas, json: object): Promise<Canvas> {
  return canvas.loadFromJSON(json).then((c) => {
    // Re-apply PowerPoint object behaviors to restored objects so saved slides
    // behave like freshly created ones (uniform stroke, no-distort textboxes).
    applyControlsToCanvas(c);
    c.renderAll();
    return c;
  });
}

export function toJSON(canvas: Canvas): Record<string, unknown> {
  return canvas.toJSON() as Record<string, unknown>;
}

export function fitToContainer(canvas: Canvas, containerWidth: number): number {
  const scale = containerWidth / SLIDE_WIDTH;
  canvas.setZoom(scale);
  canvas.setWidth(containerWidth);
  canvas.setHeight(SLIDE_HEIGHT * scale);
  canvas.renderAll();
  return scale;
}
