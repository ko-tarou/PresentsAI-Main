import { describe, it, expect, beforeEach } from "vitest";
import { useSlideStore } from "./slideStore";
import type { Slide } from "@shared/types/slide";

function slide(id: string, extra: Partial<Slide> = {}): Slide {
  return {
    id,
    content: { version: "6.0.0", objects: [], background: "#ffffff" },
    ...extra,
  } as Slide;
}

describe("useSlideStore", () => {
  beforeEach(() => {
    useSlideStore.setState({ slides: [], currentIndex: 0 });
  });

  it("setSlides replaces the array", () => {
    useSlideStore.getState().setSlides([slide("a"), slide("b")]);
    expect(useSlideStore.getState().slides.map((s) => s.id)).toEqual(["a", "b"]);
    useSlideStore.getState().setSlides([slide("c")]);
    expect(useSlideStore.getState().slides.map((s) => s.id)).toEqual(["c"]);
  });

  it("addSlide appends to the end", () => {
    useSlideStore.getState().setSlides([slide("a")]);
    useSlideStore.getState().addSlide(slide("b"));
    expect(useSlideStore.getState().slides.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("updateSlide merges content into the matching slide only", () => {
    useSlideStore.getState().setSlides([slide("a"), slide("b")]);
    useSlideStore.getState().updateSlide("a", { background: "#000000" });
    const content = (s: Slide) => s.content as unknown as Record<string, unknown>;
    const slides = useSlideStore.getState().slides;
    expect(content(slides[0]).background).toBe("#000000");
    expect(content(slides[0]).version).toBe("6.0.0");
    expect(content(slides[1]).background).toBe("#ffffff");
  });

  it("deleteSlide removes the slide and clamps currentIndex", () => {
    useSlideStore.setState({ slides: [slide("a"), slide("b")], currentIndex: 1 });
    useSlideStore.getState().deleteSlide("a");
    const state = useSlideStore.getState();
    expect(state.slides.map((s) => s.id)).toEqual(["b"]);
    expect(state.currentIndex).toBe(0);
  });

  it("deleteSlide does not push currentIndex below zero", () => {
    useSlideStore.setState({ slides: [slide("a")], currentIndex: 0 });
    useSlideStore.getState().deleteSlide("a");
    expect(useSlideStore.getState().currentIndex).toBe(0);
  });

  it("setCurrentIndex sets the index", () => {
    useSlideStore.setState({ slides: [slide("a"), slide("b"), slide("c")], currentIndex: 0 });
    useSlideStore.getState().setCurrentIndex(2);
    expect(useSlideStore.getState().currentIndex).toBe(2);
  });

  it("setSlides preserves transition/animations/layoutRef fields", () => {
    const s = slide("a", {
      transition: { type: "fade", durationMs: 300 },
      animations: [{ targetId: "o1", type: "fadeIn", order: 0 }],
      layoutRef: "title",
    });
    useSlideStore.getState().setSlides([s]);
    const got = useSlideStore.getState().slides[0];
    expect(got.transition).toEqual({ type: "fade", durationMs: 300 });
    expect(got.animations).toEqual([{ targetId: "o1", type: "fadeIn", order: 0 }]);
    expect(got.layoutRef).toBe("title");
  });

  it("updateSlideMeta updates slide-level fields on the matching slide only", () => {
    useSlideStore.getState().setSlides([slide("a"), slide("b")]);
    useSlideStore.getState().updateSlideMeta("a", {
      transition: { type: "slide", durationMs: 500 },
      animations: [{ targetId: "x", type: "zoomIn", order: 1, delayMs: 100 }],
      layoutRef: "blank",
    });
    const [a, b] = useSlideStore.getState().slides;
    expect(a.transition).toEqual({ type: "slide", durationMs: 500 });
    expect(a.animations).toEqual([{ targetId: "x", type: "zoomIn", order: 1, delayMs: 100 }]);
    expect(a.layoutRef).toBe("blank");
    // content untouched, sibling untouched
    expect(a.content.version).toBe("6.0.0");
    expect(b.transition).toBeUndefined();
  });
});
