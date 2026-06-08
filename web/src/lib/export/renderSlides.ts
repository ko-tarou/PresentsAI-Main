import { StaticCanvas } from "fabric";
import type { Slide, SlideContent } from "@shared/types/slide";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

/** PNG quality multiplier used when rasterizing a slide for export. */
const EXPORT_MULTIPLIER = 2;

/**
 * Render a single slide's content to a PNG data URL using a throwaway
 * offscreen Fabric canvas. The canvas is created detached from the DOM,
 * loaded from the slide JSON, rasterized, then disposed so no editor state
 * or visible canvas is touched.
 */
export async function renderSlideToDataURL(content: SlideContent): Promise<string> {
  // A bare <canvas> element kept off the document; StaticCanvas is non-
  // interactive, which is all we need for rasterizing.
  const el = document.createElement("canvas");
  const canvas = new StaticCanvas(el, {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    backgroundColor: content.background ?? "#ffffff",
  });
  try {
    await canvas.loadFromJSON(content as unknown as Record<string, unknown>);
    canvas.renderAll();
    return canvas.toDataURL({ format: "png", multiplier: EXPORT_MULTIPLIER });
  } finally {
    canvas.dispose();
  }
}

/**
 * Rasterize every slide in `slides` (ordered by `position`) to a PNG data URL.
 *
 * The renderer is injectable so the slide-walking logic can be unit-tested
 * without a real browser/Fabric canvas. Production callers rely on the default
 * {@link renderSlideToDataURL}.
 *
 * @returns one data URL per slide, in slide order. Length always equals
 *          `slides.length`.
 */
export async function renderAllSlides(
  slides: Slide[],
  render: (content: SlideContent) => Promise<string> = renderSlideToDataURL,
): Promise<string[]> {
  const ordered = [...slides].sort((a, b) => a.position - b.position);
  const urls: string[] = [];
  for (const slide of ordered) {
    urls.push(await render(slide.content));
  }
  return urls;
}
