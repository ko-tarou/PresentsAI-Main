import type { Canvas } from "fabric";
export function exportToPNG(canvas: Canvas, filename="slide"): void {
  const url = canvas.toDataURL({ format:"png", multiplier:2 });
  const a = document.createElement("a"); a.href=url; a.download=`${filename}.png`; a.click();
}
export function exportToSVG(canvas: Canvas, filename="slide"): void {
  const svg = canvas.toSVG();
  const url = URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));
  const a = document.createElement("a"); a.href=url; a.download=`${filename}.svg`; a.click();
  URL.revokeObjectURL(url);
}
