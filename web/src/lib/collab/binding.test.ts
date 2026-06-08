import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import { getSlides, slideToYMap, type YObjectMap, type YSlideMap } from "./schema";
import {
  ObjectBinding,
  SlideStructureBinding,
  LOCAL_ORIGIN,
  type CanvasLike,
  type ObjectJSON,
} from "./binding";

vi.mock("y-websocket", () => ({ WebsocketProvider: vi.fn() }));

/**
 * In-memory stand-in for the slice of the Fabric Canvas the binding uses. It
 * also wires its own mutation events back through an attached ObjectBinding —
 * exactly like the real canvas — so loop-prevention is genuinely exercised.
 */
class FakeCanvas implements CanvasLike {
  objects: ObjectJSON[] = [];
  renders = 0;
  binding: ObjectBinding | null = null;

  getObjects(): ObjectJSON[] {
    return [...this.objects];
  }
  toObject(obj: ObjectJSON): ObjectJSON {
    return { ...obj };
  }
  addObject(json: ObjectJSON): void {
    this.objects.push({ ...json });
    // Real fabric fires object:added on add — route it back like the hook does.
    this.binding?.onObjectAdded({ ...json });
  }
  removeObject(id: string): void {
    const before = this.objects.length;
    this.objects = this.objects.filter((o) => o.id !== id);
    if (this.objects.length !== before) this.binding?.onObjectRemoved({ id });
  }
  updateObject(id: string, patch: Record<string, unknown>): void {
    const o = this.objects.find((x) => x.id === id);
    if (!o) return;
    Object.assign(o, patch);
    this.binding?.onObjectModified(o as ObjectJSON);
  }
  requestRender(): void {
    this.renders++;
  }

  /** Simulate a *user* edit: mutate locally and notify the binding. */
  userAdd(json: ObjectJSON): void {
    this.objects.push({ ...json });
    this.binding?.onObjectAdded(json);
  }
  userModify(id: string, patch: Record<string, unknown>): void {
    const o = this.objects.find((x) => x.id === id)!;
    Object.assign(o, patch);
    this.binding?.onObjectModified(o);
  }
  userRemove(id: string): void {
    this.objects = this.objects.filter((o) => o.id !== id);
    this.binding?.onObjectRemoved({ id });
  }
}

function seedSlide(doc: Y.Doc, objects: ObjectJSON[] = []): YSlideMap {
  const slides = getSlides(doc);
  const map = slideToYMap({
    id: "slide-1",
    presentationId: "pres-1",
    position: 0,
    content: { version: "1.0", objects },
    createdAt: "x",
    updatedAt: "x",
  });
  doc.transact(() => slides.push([map]));
  return slides.get(0);
}

function objectsArray(slide: YSlideMap): Y.Array<YObjectMap> {
  return slide.get("objects") as Y.Array<YObjectMap>;
}

describe("ObjectBinding: Fabric -> Yjs", () => {
  let doc: Y.Doc;
  let canvas: FakeCanvas;
  let binding: ObjectBinding;
  let objects: Y.Array<YObjectMap>;

  beforeEach(() => {
    doc = new Y.Doc();
    const slide = seedSlide(doc);
    objects = objectsArray(slide);
    canvas = new FakeCanvas();
    binding = new ObjectBinding(doc, objects, canvas);
    canvas.binding = binding;
    binding.observe();
  });

  it("writes a new object into the doc on add", () => {
    canvas.userAdd({ id: "a", type: "rect", left: 5 });
    expect(objects.length).toBe(1);
    expect(objects.get(0).get("id")).toBe("a");
    expect(objects.get(0).get("left")).toBe(5);
  });

  it("patches changed props into the object's Y.Map on modify", () => {
    canvas.userAdd({ id: "a", type: "rect", left: 5 });
    canvas.userModify("a", { left: 99 });
    expect(objects.get(0).get("left")).toBe(99);
    expect(objects.length).toBe(1);
  });

  it("deletes the object's Y.Map on remove", () => {
    canvas.userAdd({ id: "a", type: "rect" });
    canvas.userRemove("a");
    expect(objects.length).toBe(0);
  });

  it("tags Fabric-originated writes with LOCAL_ORIGIN", () => {
    const origins: unknown[] = [];
    doc.on("afterTransaction", (txn) => origins.push(txn.origin));
    canvas.userAdd({ id: "a", type: "rect" });
    expect(origins).toContain(LOCAL_ORIGIN);
  });
});

describe("ObjectBinding: z-order (moveObject)", () => {
  let doc: Y.Doc;
  let objects: Y.Array<YObjectMap>;
  let binding: ObjectBinding;

  beforeEach(() => {
    doc = new Y.Doc();
    const slide = seedSlide(doc, [
      { id: "a", type: "rect" },
      { id: "b", type: "circle" },
      { id: "c", type: "textbox" },
    ]);
    objects = objectsArray(slide);
    binding = new ObjectBinding(doc, objects, new FakeCanvas());
  });

  const ids = () => objects.map((m) => m.get("id"));

  it("moves an object to a later z-index, preserving its props", () => {
    doc.transact(() => objects.get(0).set("left", 7));
    binding.moveObject("a", 2);
    expect(ids()).toEqual(["b", "c", "a"]);
    // The cloned Y.Map keeps the moved object's properties.
    expect(objects.get(2).get("left")).toBe(7);
  });

  it("moves an object to an earlier z-index", () => {
    binding.moveObject("c", 0);
    expect(ids()).toEqual(["c", "a", "b"]);
  });

  it("clamps an out-of-range target index", () => {
    binding.moveObject("a", 99);
    expect(ids()).toEqual(["b", "c", "a"]);
  });

  it("is a no-op for an unknown id or an unchanged position", () => {
    binding.moveObject("zzz", 0);
    binding.moveObject("a", 0);
    expect(ids()).toEqual(["a", "b", "c"]);
  });

  it("tags the reorder with LOCAL_ORIGIN so it does not bounce back", () => {
    const origins: unknown[] = [];
    doc.on("afterTransaction", (txn) => origins.push(txn.origin));
    binding.moveObject("a", 2);
    expect(origins).toContain(LOCAL_ORIGIN);
  });
});

describe("ObjectBinding: Yjs -> Fabric", () => {
  it("reconciles a remote property patch onto the canvas", () => {
    const doc = new Y.Doc();
    const slide = seedSlide(doc, [{ id: "a", type: "rect", left: 0 }]);
    const objects = objectsArray(slide);
    const canvas = new FakeCanvas();
    const binding = new ObjectBinding(doc, objects, canvas);
    canvas.binding = binding;
    binding.observe();

    binding.reconcileToCanvas();
    expect(canvas.objects.map((o) => o.id)).toEqual(["a"]);

    doc.transact(() => objects.get(0).set("left", 42));
    expect(canvas.objects[0].left).toBe(42);
  });

  it("applies a remote object insert onto the canvas", () => {
    const doc = new Y.Doc();
    const slide = seedSlide(doc, []);
    const objects = objectsArray(slide);
    const canvas = new FakeCanvas();
    const binding = new ObjectBinding(doc, objects, canvas);
    canvas.binding = binding;
    binding.observe();

    doc.transact(() => {
      const m = new Y.Map<unknown>();
      m.set("id", "b");
      m.set("type", "circle");
      objects.push([m]);
    });
    expect(canvas.objects.map((o) => o.id)).toEqual(["b"]);
  });

  it("removes a canvas object when its Y.Map is deleted remotely", () => {
    const doc = new Y.Doc();
    const slide = seedSlide(doc, [{ id: "a", type: "rect" }]);
    const objects = objectsArray(slide);
    const canvas = new FakeCanvas();
    const binding = new ObjectBinding(doc, objects, canvas);
    canvas.binding = binding;
    binding.observe();
    binding.reconcileToCanvas();
    expect(canvas.objects).toHaveLength(1);

    doc.transact(() => objects.delete(0, 1));
    expect(canvas.objects).toHaveLength(0);
  });
});

describe("ObjectBinding: loop prevention", () => {
  it("does not write back to the doc while applying a remote change", () => {
    const doc = new Y.Doc();
    const slide = seedSlide(doc, []);
    const objects = objectsArray(slide);
    const canvas = new FakeCanvas();
    const binding = new ObjectBinding(doc, objects, canvas);
    canvas.binding = binding;
    binding.observe();

    let txnCount = 0;
    doc.on("afterTransaction", (txn) => {
      if (txn.origin === LOCAL_ORIGIN) txnCount++;
    });

    // A purely remote insert: addObject() will route back through onObjectAdded,
    // which must bail because applyingRemote is set -> zero LOCAL_ORIGIN txns.
    doc.transact(() => {
      const m = new Y.Map<unknown>();
      m.set("id", "b");
      objects.push([m]);
    });

    expect(canvas.objects.map((o) => o.id)).toEqual(["b"]);
    expect(txnCount).toBe(0);
    expect(objects.length).toBe(1); // not duplicated by a write-back
  });

  it("a local add does not re-trigger reconcile (origin guard)", () => {
    const doc = new Y.Doc();
    const slide = seedSlide(doc, []);
    const objects = objectsArray(slide);
    const canvas = new FakeCanvas();
    const binding = new ObjectBinding(doc, objects, canvas);
    canvas.binding = binding;
    binding.observe();

    const spy = vi.spyOn(binding, "reconcileToCanvas");
    canvas.userAdd({ id: "a", type: "rect" });
    expect(spy).not.toHaveBeenCalled();
    expect(objects.length).toBe(1);
  });
});

describe("ObjectBinding: two-peer convergence", () => {
  it("converges two docs editing the same slide via applyUpdate round-trips", () => {
    const docA = new Y.Doc();
    const slideA = seedSlide(docA, [{ id: "a", type: "rect", left: 0 }]);
    const objA = objectsArray(slideA);
    const canvasA = new FakeCanvas();
    const bindingA = new ObjectBinding(docA, objA, canvasA);
    canvasA.binding = bindingA;
    bindingA.observe();
    bindingA.reconcileToCanvas();

    // Peer B starts from A's full state (the "join the room" handshake).
    const docB = new Y.Doc();
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));
    const slideB = getSlides(docB).get(0);
    const objB = objectsArray(slideB);
    const canvasB = new FakeCanvas();
    const bindingB = new ObjectBinding(docB, objB, canvasB);
    canvasB.binding = bindingB;
    bindingB.observe();
    bindingB.reconcileToCanvas();

    // Relay every A update to B and vice-versa.
    docA.on("update", (u) => Y.applyUpdate(docB, u));
    docB.on("update", (u) => Y.applyUpdate(docA, u));

    // A moves the rect; B adds a circle — concurrent-ish edits.
    canvasA.userModify("a", { left: 100 });
    canvasB.userAdd({ id: "c", type: "circle", top: 7 });

    // Both docs hold the same objects + props.
    const asJSON = (arr: Y.Array<YObjectMap>) =>
      arr.map((m) => m.toJSON()).sort((x, y) => String(x.id).localeCompare(String(y.id)));
    expect(asJSON(objA)).toEqual(asJSON(objB));

    // Both canvases converged too.
    const ids = (c: FakeCanvas) => c.objects.map((o) => o.id).sort();
    expect(ids(canvasA)).toEqual(["a", "c"]);
    expect(ids(canvasB)).toEqual(["a", "c"]);
    expect(canvasA.objects.find((o) => o.id === "a")!.left).toBe(100);
    expect(canvasB.objects.find((o) => o.id === "a")!.left).toBe(100);
  });
});

describe("SlideStructureBinding", () => {
  function setup() {
    const doc = new Y.Doc();
    const slides = getSlides(doc);
    const received: { id: string; position: number }[][] = [];
    const binding = new SlideStructureBinding(doc, slides, {
      setSlides: (list) =>
        received.push(list.map((s) => ({ id: s.id, position: s.position }))),
    });
    binding.observe();
    return { doc, slides, binding, received };
  }

  it("adds slides and assigns sequential positions", () => {
    const { slides, binding } = setup();
    binding.addSlide("s1", "p");
    binding.addSlide("s2", "p");
    expect(slides.map((s) => s.get("id"))).toEqual(["s1", "s2"]);
    expect(slides.map((s) => s.get("position"))).toEqual([0, 1]);
  });

  it("removes a slide and renumbers", () => {
    const { slides, binding } = setup();
    binding.addSlide("s1", "p");
    binding.addSlide("s2", "p");
    binding.addSlide("s3", "p");
    binding.removeSlide("s2");
    expect(slides.map((s) => s.get("id"))).toEqual(["s1", "s3"]);
    expect(slides.map((s) => s.get("position"))).toEqual([0, 1]);
  });

  it("reorders a slide and renumbers, preserving objects", () => {
    const { doc, slides, binding } = setup();
    binding.addSlide("s1", "p");
    binding.addSlide("s2", "p");
    doc.transact(() => {
      const objs = slides.get(0).get("objects") as Y.Array<YObjectMap>;
      const m = new Y.Map<unknown>();
      m.set("id", "obj-x");
      objs.push([m]);
    });
    binding.moveSlide("s1", 1);
    expect(slides.map((s) => s.get("id"))).toEqual(["s2", "s1"]);
    expect(slides.map((s) => s.get("position"))).toEqual([0, 1]);
    const movedObjs = slides.get(1).get("objects") as Y.Array<YObjectMap>;
    expect(movedObjs.get(0).get("id")).toBe("obj-x");
  });

  it("pushes remote structural changes to the target list", () => {
    const { doc, slides, received } = setup();
    // Remote insert (not LOCAL_ORIGIN) should reach the target.
    doc.transact(() => {
      const m = new Y.Map<unknown>();
      m.set("id", "remote-1");
      m.set("position", 0);
      m.set("objects", new Y.Array());
      slides.push([m]);
    });
    expect(received.at(-1)).toEqual([{ id: "remote-1", position: 0 }]);
  });

  it("does not echo local structural ops back to the target", () => {
    const { binding, received } = setup();
    binding.addSlide("s1", "p"); // LOCAL_ORIGIN — observer must ignore it
    expect(received).toHaveLength(0);
  });
});
