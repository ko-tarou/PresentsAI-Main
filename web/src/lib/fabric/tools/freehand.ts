import { Canvas } from "fabric";

export function enableFreehand(canvas: Canvas, color = "#333", width = 3) {
  canvas.isDrawingMode = true;
  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = width;
  }
}

export function disableFreehand(canvas: Canvas) {
  canvas.isDrawingMode = false;
}
