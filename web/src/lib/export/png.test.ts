import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Slide, SlideContent } from "@shared/types/slide";

vi.mock("./renderSlides", () => ({
  renderAllSlides: vi.fn(async (slides: Slide[]) =>
    slides.map((_, i) => `data:image/png;base64,IMG${i}`),
  ),
}));

import {
  exportAllSlidesToPNG,
  exportToPNG,
  exportToSVG,
} from "./png";
import { renderAllSlides } from "./renderSlides";

function makeSlide(id: string, position: number): Slide {
  const content: SlideContent = { version: "6.0.0", objects: [] };
  return {
    id,
    presentationId: "p1",
    position,
    content,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };
}

// Capture every anchor the exporter creates so we can assert href + download.
interface FakeAnchor {
  href: string;
  download: string;
  click: ReturnType<typeof vi.fn>;
}

let anchors: FakeAnchor[] = [];
// Loosely typed so the typed createElement overloads don't fight the mock impl.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createElementSpy: any;

beforeEach(() => {
  anchors = [];
  vi.mocked(renderAllSlides).mockClear();
  const realCreate = document.createElement.bind(document);
  createElementSpy = vi
    .spyOn(document, "createElement")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation(((tag: string) => {
      if (tag === "a") {
        const a: FakeAnchor = { href: "", download: "", click: vi.fn() };
        anchors.push(a);
        return a as unknown as HTMLElement;
      }
      return realCreate(tag as "div");
    }) as any);
});

afterEach(() => {
  createElementSpy.mockRestore();
});

describe("exportAllSlidesToPNG", () => {
  it("downloads one numbered PNG per slide in order", async () => {
    const slides = [makeSlide("a", 0), makeSlide("b", 1), makeSlide("c", 2)];
    await exportAllSlidesToPNG(slides, "shot");

    expect(anchors).toHaveLength(3);
    expect(anchors.map((a) => a.download)).toEqual([
      "shot-1.png",
      "shot-2.png",
      "shot-3.png",
    ]);
    expect(anchors[0].href).toBe("data:image/png;base64,IMG0");
    anchors.forEach((a) => expect(a.click).toHaveBeenCalledOnce());
  });

  it("defaults the filename prefix to 'slide'", async () => {
    await exportAllSlidesToPNG([makeSlide("a", 0)]);
    expect(anchors[0].download).toBe("slide-1.png");
  });

  it("downloads nothing for an empty deck", async () => {
    await exportAllSlidesToPNG([]);
    expect(anchors).toHaveLength(0);
  });
});

describe("exportToPNG (single visible canvas)", () => {
  it("rasterizes the canvas at 2x and downloads it", () => {
    const toDataURL = vi.fn(() => "data:image/png;base64,SINGLE");
    const canvas = { toDataURL } as unknown as Parameters<typeof exportToPNG>[0];

    exportToPNG(canvas, "current");

    expect(toDataURL).toHaveBeenCalledWith({ format: "png", multiplier: 2 });
    expect(anchors[0].href).toBe("data:image/png;base64,SINGLE");
    expect(anchors[0].download).toBe("current.png");
    expect(anchors[0].click).toHaveBeenCalledOnce();
  });
});

describe("exportToSVG", () => {
  it("serializes the canvas to an SVG blob URL and downloads it", () => {
    const createObjectURL = vi.fn(() => "blob:svg-url");
    const revokeObjectURL = vi.fn();
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;
    try {
      const toSVG = vi.fn(() => "<svg></svg>");
      const canvas = { toSVG } as unknown as Parameters<typeof exportToSVG>[0];

      exportToSVG(canvas, "vector");

      expect(toSVG).toHaveBeenCalledOnce();
      expect(anchors[0].href).toBe("blob:svg-url");
      expect(anchors[0].download).toBe("vector.svg");
      expect(anchors[0].click).toHaveBeenCalledOnce();
      // The object URL is revoked after the download is triggered.
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:svg-url");
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
  });
});
