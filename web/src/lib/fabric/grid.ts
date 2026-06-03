import { Canvas, Line } from "fabric";

export function toggleGrid(canvas: Canvas, show: boolean, gridSize = 20) {
  const existing = canvas.getObjects().filter((o) => (o as Line & { _isGrid?: boolean })._isGrid);
  existing.forEach((o) => canvas.remove(o));
  if (!show) { canvas.renderAll(); return; }
  const w = canvas.getWidth(), h = canvas.getHeight();
  for (let x = 0; x <= w; x += gridSize) {
    const line = new Line([x, 0, x, h], { stroke: "#e0e0e0", strokeWidth: 0.5, selectable: false, evented: false, excludeFromExport: true });
    (line as Line & { _isGrid: boolean })._isGrid = true;
    canvas.add(line); canvas.sendObjectToBack(line);
  }
  for (let y = 0; y <= h; y += gridSize) {
    const line = new Line([0, y, w, y], { stroke: "#e0e0e0", strokeWidth: 0.5, selectable: false, evented: false, excludeFromExport: true });
    (line as Line & { _isGrid: boolean })._isGrid = true;
    canvas.add(line); canvas.sendObjectToBack(line);
  }
  canvas.renderAll();
}

export function enableSnap(canvas: Canvas, gridSize = 10) {
  canvas.on("object:moving", (e) => {
    const obj = e.target;
    if (!obj) return;
    obj.set({ left: Math.round((obj.left ?? 0) / gridSize) * gridSize, top: Math.round((obj.top ?? 0) / gridSize) * gridSize });
  });
}
