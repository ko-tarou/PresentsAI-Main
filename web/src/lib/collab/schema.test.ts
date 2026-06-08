import { describe, it, expect, vi } from "vitest";
import * as Y from "yjs";
import type { Slide } from "@shared/types/slide";
import {
  SLIDES_KEY,
  getSlides,
  slideToYMap,
  initializeDoc,
  yMapToSlideContent,
  docToSlideContents,
  type YObjectMap,
} from "./schema";

// y-websocket is never imported here, but guard against accidental network use
// if the provider gets pulled in transitively.
vi.mock("y-websocket", () => ({
  WebsocketProvider: vi.fn(),
}));

function makeSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "slide-1",
    presentationId: "pres-1",
    position: 0,
    notes: "speaker notes",
    content: {
      version: "1.0",
      background: "#ffffff",
      objects: [
        { id: "obj-a", type: "rect", left: 10, top: 20 },
        { id: "obj-b", type: "text", text: "hello" },
      ],
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("collab schema", () => {
  it("stores the slide list under the SLIDES_KEY root array", () => {
    const doc = new Y.Doc();
    initializeDoc(doc, [makeSlide()]);
    expect(getSlides(doc)).toBe(doc.getArray(SLIDES_KEY));
    expect(getSlides(doc).length).toBe(1);
  });

  it("maps a slide to a Y.Map with nested Y.Array of object maps", () => {
    // A Y.Map with nested Y types must be integrated into a doc before reads.
    const doc = new Y.Doc();
    const map = slideToYMap(makeSlide());
    doc.getArray("tmp").push([map]);
    expect(map.get("id")).toBe("slide-1");
    expect(map.get("version")).toBe("1.0");
    expect(map.get("background")).toBe("#ffffff");
    const objects = map.get("objects") as Y.Array<YObjectMap>;
    expect(objects).toBeInstanceOf(Y.Array);
    expect(objects.length).toBe(2);
    expect((objects.get(0) as YObjectMap).get("id")).toBe("obj-a");
  });

  it("round-trips a slide through the doc projection", () => {
    const doc = new Y.Doc();
    const slide = makeSlide();
    initializeDoc(doc, [slide]);
    const [content] = docToSlideContents(doc);
    expect(content).toEqual(slide.content);
  });

  it("yMapToSlideContent defaults version and omits absent background", () => {
    const doc = new Y.Doc();
    const map = new Y.Map<unknown>();
    doc.getArray("tmp").push([map]);
    map.set("objects", new Y.Array());
    const content = yMapToSlideContent(map);
    expect(content.version).toBe("1.0");
    expect(content.objects).toEqual([]);
    expect("background" in content).toBe(false);
  });

  it("initializeDoc replaces existing content", () => {
    const doc = new Y.Doc();
    initializeDoc(doc, [makeSlide({ id: "old" })]);
    initializeDoc(doc, [makeSlide({ id: "new-1" }), makeSlide({ id: "new-2" })]);
    expect(docToSlideContents(doc)).toHaveLength(2);
    expect(getSlides(doc).map((s) => s.get("id"))).toEqual(["new-1", "new-2"]);
  });

  it("syncs a doc update to a second peer via encoded state", () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    initializeDoc(a, [makeSlide()]);

    // Simulate the wire: encode A's state and apply it to B.
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a));

    expect(docToSlideContents(b)).toEqual(docToSlideContents(a));
    expect(getSlides(b).get(0).get("id")).toBe("slide-1");
  });
});
