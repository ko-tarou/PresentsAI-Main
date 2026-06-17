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
  findSlideMap,
  replaceSlideContent,
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

  it("initializeDoc only appends slides whose id is not already present", () => {
    const doc = new Y.Doc();
    initializeDoc(doc, [makeSlide({ id: "a" })]);
    // Re-seeding with an overlapping id-set must NOT re-insert "a" (idempotent),
    // only the genuinely-new "b" is appended.
    initializeDoc(doc, [makeSlide({ id: "a" }), makeSlide({ id: "b" })]);
    expect(getSlides(doc).map((s) => s.get("id"))).toEqual(["a", "b"]);
  });

  it("initializeDoc is idempotent: re-seeding the same list is a no-op (#132)", () => {
    // Regression: a client that seeds an empty room, then re-runs the seed (e.g.
    // effect re-fire, or its own seed echoing back over the wire), must never
    // duplicate slides. A duplicated slide id is what crashed the slide list
    // render with "two children with the same key".
    const doc = new Y.Doc();
    const list = [makeSlide({ id: "s1" }), makeSlide({ id: "s2" })];
    initializeDoc(doc, list);
    initializeDoc(doc, list);
    expect(getSlides(doc).map((s) => s.get("id"))).toEqual(["s1", "s2"]);
  });

  it("re-seeding a doc that already received a remote slide is a no-op (#132)", () => {
    // The real-world race: the server's persisted slide syncs into this client's
    // doc, THEN this client (effect re-fire / late list response) tries to seed
    // the same slide it loaded over REST. id-keyed seeding must recognize the
    // already-synced slide and not append a second copy.
    const server = new Y.Doc();
    initializeDoc(server, [makeSlide({ id: "dup" })]);

    const client = new Y.Doc();
    // Server state arrives first (post-sync).
    Y.applyUpdate(client, Y.encodeStateAsUpdate(server));
    // Now the client attempts to seed the same slide from its REST load.
    initializeDoc(client, [makeSlide({ id: "dup" })]);

    expect(getSlides(client).map((s) => s.get("id"))).toEqual(["dup"]);
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

  it("findSlideMap returns the slide map by id (or undefined)", () => {
    const doc = new Y.Doc();
    initializeDoc(doc, [makeSlide({ id: "s1" }), makeSlide({ id: "s2" })]);
    expect(findSlideMap(doc, "s2")?.get("id")).toBe("s2");
    expect(findSlideMap(doc, "missing")).toBeUndefined();
  });

  it("replaceSlideContent swaps objects/version/background, keeps structure", () => {
    const doc = new Y.Doc();
    initializeDoc(doc, [makeSlide({ id: "s1", position: 3, notes: "keep me" })]);
    const ok = replaceSlideContent(doc, "s1", {
      version: "9.9.9",
      background: "#000000",
      objects: [{ id: "restored", type: "circle" }],
    });
    expect(ok).toBe(true);
    const slide = findSlideMap(doc, "s1")!;
    // Structural fields untouched.
    expect(slide.get("position")).toBe(3);
    expect(slide.get("notes")).toBe("keep me");
    // Content replaced.
    const content = yMapToSlideContent(slide);
    expect(content.version).toBe("9.9.9");
    expect(content.background).toBe("#000000");
    expect(content.objects).toEqual([{ id: "restored", type: "circle" }]);
  });

  it("replaceSlideContent is observed as a single transaction by peers", () => {
    const doc = new Y.Doc();
    initializeDoc(doc, [makeSlide({ id: "s1" })]);
    let updates = 0;
    getSlides(doc).observeDeep(() => { updates += 1; });
    replaceSlideContent(doc, "s1", { version: "2.0", objects: [{ id: "x", type: "rect" }] });
    expect(updates).toBe(1);
  });

  it("replaceSlideContent returns false for an unknown slide", () => {
    const doc = new Y.Doc();
    initializeDoc(doc, [makeSlide({ id: "s1" })]);
    expect(
      replaceSlideContent(doc, "nope", { version: "1.0", objects: [] }),
    ).toBe(false);
  });
});
