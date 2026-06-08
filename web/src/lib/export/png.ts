import type { Canvas } from "fabric";
import type { Slide } from "@shared/types/slide";
import { renderAllSlides } from "./renderSlides";

function downloadDataURL(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

/**
 * Export every slide in the deck as a separate PNG, downloaded as a numbered
 * file group (`slide-1.png`, `slide-2.png`, ...). Each slide is rasterized on
 * a throwaway offscreen canvas, independent of the currently visible canvas.
 */
export async function exportAllSlidesToPNG(slides: Slide[], filename = "slide"): Promise<void> {
  const urls = await renderAllSlides(slides);
  urls.forEach((url, i) => downloadDataURL(url, `${filename}-${i + 1}.png`));
}

/** Export the single visible canvas as PNG (used for ad-hoc single-slide saves). */
export function exportToPNG(canvas: Canvas, filename = "slide"): void {
  const url = canvas.toDataURL({ format: "png", multiplier: 2 });
  downloadDataURL(url, `${filename}.png`);
}

export function exportToSVG(canvas: Canvas, filename = "slide"): void {
  const svg = canvas.toSVG();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  downloadDataURL(url, `${filename}.svg`);
  URL.revokeObjectURL(url);
}
