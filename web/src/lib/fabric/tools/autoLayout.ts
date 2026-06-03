import { Canvas } from "fabric";

export type AutoLayoutDirection = "horizontal" | "vertical";

export interface AutoLayoutOptions {
  direction: AutoLayoutDirection;
  gap: number;
  padding: number;
  align: "start" | "center" | "end";
}

export function applyAutoLayout(canvas: Canvas, opts: AutoLayoutOptions): void {
  const selected = canvas.getActiveObjects();
  if (selected.length < 2) return;

  const sorted = [...selected].sort((a, b) =>
    opts.direction === "horizontal" ? (a.left ?? 0) - (b.left ?? 0) : (a.top ?? 0) - (b.top ?? 0)
  );

  let cursor = opts.padding;
  const maxCross = opts.direction === "horizontal"
    ? Math.max(...sorted.map(o => o.getScaledHeight()))
    : Math.max(...sorted.map(o => o.getScaledWidth()));

  sorted.forEach(obj => {
    const cross = opts.direction === "horizontal" ? obj.getScaledHeight() : obj.getScaledWidth();
    const crossOffset = opts.align === "center" ? (maxCross - cross) / 2
      : opts.align === "end" ? maxCross - cross : 0;

    if (opts.direction === "horizontal") {
      obj.set({ left: cursor, top: opts.padding + crossOffset });
      cursor += obj.getScaledWidth() + opts.gap;
    } else {
      obj.set({ top: cursor, left: opts.padding + crossOffset });
      cursor += obj.getScaledHeight() + opts.gap;
    }
    obj.setCoords();
  });
  canvas.renderAll();
}

export function distributeObjects(canvas: Canvas, direction: "horizontal" | "vertical"): void {
  const objs = canvas.getActiveObjects();
  if (objs.length < 3) return;

  if (direction === "horizontal") {
    const sorted = [...objs].sort((a, b) => (a.left ?? 0) - (b.left ?? 0));
    const first = sorted[0].left ?? 0;
    const last = (sorted[sorted.length - 1].left ?? 0) + sorted[sorted.length - 1].getScaledWidth();
    const total = sorted.reduce((s, o) => s + o.getScaledWidth(), 0);
    const gap = (last - first - total) / (sorted.length - 1);
    let x = first;
    sorted.forEach(o => { o.set({ left: x }); x += o.getScaledWidth() + gap; o.setCoords(); });
  } else {
    const sorted = [...objs].sort((a, b) => (a.top ?? 0) - (b.top ?? 0));
    const first = sorted[0].top ?? 0;
    const last = (sorted[sorted.length - 1].top ?? 0) + sorted[sorted.length - 1].getScaledHeight();
    const total = sorted.reduce((s, o) => s + o.getScaledHeight(), 0);
    const gap = (last - first - total) / (sorted.length - 1);
    let y = first;
    sorted.forEach(o => { o.set({ top: y }); y += o.getScaledHeight() + gap; o.setCoords(); });
  }
  canvas.renderAll();
}
