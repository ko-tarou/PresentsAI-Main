import { describe, it, expect, vi } from "vitest";
import * as Y from "yjs";
import { getSlides, slideToYMap, type YObjectMap } from "./schema";
import { SlideStructureBinding } from "./binding";
import { projectDoc } from "./projection";

vi.mock("y-websocket", () => ({ WebsocketProvider: vi.fn() }));

function seed(doc: Y.Doc) {
  const slides = getSlides(doc);
  doc.transact(() => {
    slides.push([
      slideToYMap({
        id: "s1",
        presentationId: "p",
        position: 0,
        content: { version: "1.0", objects: [{ id: "o1", type: "rect", left: 3 }] },
        createdAt: "x",
        updatedAt: "x",
      }),
    ]);
  });
}

describe("projectDoc (JSONB projection)", () => {
  it("projects ordered slides with id, position, and materialized content", () => {
    const doc = new Y.Doc();
    seed(doc);
    const out = projectDoc(doc);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("s1");
    expect(out[0].position).toBe(0);
    expect(out[0].content.version).toBe("1.0");
    expect(out[0].content.objects).toEqual([{ id: "o1", type: "rect", left: 3 }]);
  });

  it("reflects a live object edit in the projection", () => {
    const doc = new Y.Doc();
    seed(doc);
    const objects = getSlides(doc).get(0).get("objects") as Y.Array<YObjectMap>;
    doc.transact(() => objects.get(0).set("left", 99));
    expect(projectDoc(doc)[0].content.objects[0]).toMatchObject({ left: 99 });
  });

  it("skips slide maps without a stable id", () => {
    const doc = new Y.Doc();
    doc.transact(() => {
      const m = new Y.Map<unknown>();
      m.set("position", 0);
      getSlides(doc).push([m]);
    });
    expect(projectDoc(doc)).toHaveLength(0);
  });

  it("deduplicates slides sharing an id, keeping the first (#132)", () => {
    // A Y.Array carries no unique-key constraint, so a concurrent seed / merge
    // can leave two entries with the same slide id. The projection feeds the
    // React slide list, so it must collapse duplicates or the render crashes
    // with "two children with the same key". The first occurrence wins.
    const doc = new Y.Doc();
    seed(doc);
    doc.transact(() => {
      getSlides(doc).push([
        slideToYMap({
          id: "s1", // same id as the seeded slide
          presentationId: "p",
          position: 1,
          content: { version: "1.0", objects: [{ id: "dupe", type: "rect" }] },
          createdAt: "x",
          updatedAt: "x",
        }),
      ]);
    });
    expect(getSlides(doc).length).toBe(2); // raw array genuinely has two
    const out = projectDoc(doc);
    expect(out).toHaveLength(1); // projection collapses them
    expect(out[0].id).toBe("s1");
    expect(out[0].position).toBe(0); // first occurrence wins
  });

  it("survives a persistence round-trip (encode/applyUpdate) intact", () => {
    const docA = new Y.Doc();
    seed(docA);
    const update = Y.encodeStateAsUpdate(docA);

    // Simulate server restart + restore: a fresh doc rebuilt from the update log.
    const docB = new Y.Doc();
    Y.applyUpdate(docB, update);

    expect(projectDoc(docB)).toEqual(projectDoc(docA));
  });
});

describe("structure sync + projection convergence", () => {
  it("add / move / remove on one peer project identically on a synced peer", () => {
    const docA = new Y.Doc();
    const bindingA = new SlideStructureBinding(docA, getSlides(docA), { setSlides: () => {} });
    bindingA.observe();

    const docB = new Y.Doc();
    const bindingB = new SlideStructureBinding(docB, getSlides(docB), { setSlides: () => {} });
    bindingB.observe();
    docA.on("update", (u) => Y.applyUpdate(docB, u));
    docB.on("update", (u) => Y.applyUpdate(docA, u));

    bindingA.addSlide("s1", "p");
    bindingA.addSlide("s2", "p");
    bindingB.addSlide("s3", "p");
    bindingA.moveSlide("s1", 2);
    bindingB.removeSlide("s2");

    const idsA = projectDoc(docA).map((s) => s.id);
    const idsB = projectDoc(docB).map((s) => s.id);
    expect(idsA).toEqual(idsB);
    // positions are contiguous from 0..n-1 on both peers.
    expect(projectDoc(docA).map((s) => s.position)).toEqual(idsA.map((_, i) => i));
  });
});
