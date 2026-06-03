import { Canvas, Gradient, Shadow } from "fabric";

export interface StyleOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number } | null;
}

export function applyStyle(canvas: Canvas, opts: StyleOptions) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  if (opts.fill !== undefined) obj.set("fill", opts.fill);
  if (opts.stroke !== undefined) obj.set("stroke", opts.stroke);
  if (opts.strokeWidth !== undefined) obj.set("strokeWidth", opts.strokeWidth);
  if (opts.opacity !== undefined) obj.set("opacity", opts.opacity);
  if (opts.shadow !== undefined) {
    obj.set("shadow", opts.shadow ? new Shadow(opts.shadow) : null);
  }
  canvas.requestRenderAll();
}

export function applyLinearGradient(canvas: Canvas, color1: string, color2: string) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const w = obj.width ?? 100;
  const h = obj.height ?? 100;
  const gradient = new Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: w, y2: 0 },
    colorStops: [
      { offset: 0, color: color1 },
      { offset: 1, color: color2 },
    ],
  });
  obj.set("fill", gradient);
  canvas.requestRenderAll();
}
