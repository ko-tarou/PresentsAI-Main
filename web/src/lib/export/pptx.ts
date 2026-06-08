import pptxgen from "pptxgenjs";
import type { Slide } from "@shared/types/slide";
import { renderAllSlides } from "./renderSlides";

/**
 * Export the whole deck as a PPTX — one PowerPoint slide per deck slide. Each
 * slide is rasterized (full-bleed image) on a throwaway offscreen canvas.
 *
 * NOTE: slides are embedded as raster images, not native PPTX shapes/text.
 * Vectorizing into editable shapes is intentionally out of scope (separate PR).
 */
export async function exportToPPTX(slides: Slide[], title = "presentation"): Promise<void> {
  const urls = await renderAllSlides(slides);

  const pptx = new pptxgen();
  pptx.defineLayout({ name: "SLIDE_16x9", width: 10, height: 5.625 });
  pptx.layout = "SLIDE_16x9";

  for (const url of urls) {
    const slide = pptx.addSlide();
    slide.addImage({ data: url, x: 0, y: 0, w: "100%", h: "100%" });
  }

  await pptx.writeFile({ fileName: `${title}.pptx` });
}
