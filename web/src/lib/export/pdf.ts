import jsPDF from "jspdf";
import type { Slide } from "@shared/types/slide";
import { renderAllSlides } from "./renderSlides";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

/**
 * Export the whole deck as a multi-page PDF — one slide per page. Each slide is
 * rasterized on a throwaway offscreen canvas, so the result is independent of
 * which slide is currently visible in the editor.
 */
export async function exportToPDF(slides: Slide[], title = "presentation"): Promise<void> {
  const urls = await renderAllSlides(slides);
  if (urls.length === 0) return;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [SLIDE_WIDTH, SLIDE_HEIGHT],
  });
  urls.forEach((url, i) => {
    if (i > 0) pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], "landscape");
    pdf.addImage(url, "PNG", 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
  });
  pdf.save(`${title}.pdf`);
}
