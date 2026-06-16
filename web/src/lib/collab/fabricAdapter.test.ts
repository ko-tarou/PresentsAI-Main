import { describe, it, expect, vi } from "vitest";
import * as Y from "yjs";
import { Canvas, type FabricObject } from "fabric";
import { getSlides, slideToYMap, type YObjectMap } from "./schema";
import { ObjectBinding, type ObjectJSON } from "./binding";
import { FabricCanvasAdapter } from "./fabricAdapter";

vi.mock("y-websocket", () => ({ WebsocketProvider: vi.fn() }));

/**
 * Integration regression for the PPTX-import crash "o.toObject is not a
 * function" (fabricAdapter.ts withId).
 *
 * Root cause: ObjectBinding.onObjectAdded/onObjectModified serialize the live
 * FabricObject themselves via `this.canvas.toObject(obj)`. The editor hook used
 * to *pre-serialize* with adapter.toObject before calling the binding, so the
 * binding's internal toObject ran a *second* time — on the already-plain JSON,
 * which has no `.toObject` method — and threw. It only surfaced on import
 * because reconcileToCanvas re-adds the imported objects, firing object:added.
 *
 * This test drives the real FabricCanvasAdapter + ObjectBinding against a real
 * Fabric Canvas with the exact wiring useObjectBinding uses, so a regression
 * (re-introducing the double serialize) fails here.
 */

function makeCanvas(): Canvas {
  return new Canvas(document.createElement("canvas"), { width: 200, height: 200 });
}

/** Wire object:* events the way useObjectBinding does (passing the LIVE target). */
function wire(canvas: Canvas, binding: ObjectBinding, adapter: FabricCanvasAdapter) {
  const errors: unknown[] = [];
  canvas.on("object:added", (e: { target?: FabricObject }) => {
    try {
      if (e.target) binding.onObjectAdded(e.target as unknown as ObjectJSON);
    } catch (err) {
      errors.push(err);
    }
  });
  canvas.on("object:modified", (e: { target?: FabricObject }) => {
    try {
      if (e.target) binding.onObjectModified(e.target as unknown as ObjectJSON);
    } catch (err) {
      errors.push(err);
    }
  });
  void adapter;
  return errors;
}

function seedDoc(objects: ObjectJSON[]) {
  const doc = new Y.Doc();
  const slides = getSlides(doc);
  const map = slideToYMap({
    id: "slide-1",
    presentationId: "p",
    position: 0,
    content: { version: "6.0.0", objects },
    createdAt: "x",
    updatedAt: "x",
  });
  doc.transact(() => slides.push([map]));
  const arr = slides.get(0).get("objects") as Y.Array<YObjectMap>;
  return { doc, objects: arr };
}

describe("FabricCanvasAdapter + ObjectBinding: PPTX import reconcile", () => {
  it("reconciles imported text/shape objects onto a real canvas without crashing", async () => {
    const pptxObjects: ObjectJSON[] = [
      {
        type: "Textbox",
        version: "6.0.0",
        id: "t1",
        left: 10,
        top: 10,
        width: 200,
        text: "Imported title",
        fontSize: 24,
        fontFamily: "sans-serif",
        fill: "#000000",
      },
      {
        type: "Rect",
        version: "6.0.0",
        id: "r1",
        left: 0,
        top: 0,
        width: 50,
        height: 50,
        fill: "#abc123",
        stroke: "transparent",
        strokeWidth: 0,
        strokeUniform: true,
      },
    ];
    const { doc, objects } = seedDoc(pptxObjects);
    const canvas = makeCanvas();
    const adapter = new FabricCanvasAdapter(canvas);
    const binding = new ObjectBinding(doc, objects, adapter);
    binding.observe();
    const errors = wire(canvas, binding, adapter);

    binding.reconcileToCanvas();
    // addObject is async (util.enlivenObjects); flush the microtask/timer queue.
    await new Promise((r) => setTimeout(r, 50));

    expect(errors).toEqual([]); // no "o.toObject is not a function"
    expect(canvas.getObjects()).toHaveLength(2);
    // The doc is unchanged: imported objects already lived there, so the
    // object:added write-back must dedupe by id, not duplicate.
    expect(objects.length).toBe(2);
    expect(objects.map((m) => m.get("id")).sort()).toEqual(["r1", "t1"]);
  });

  it("adapter.toObject serializes a live FabricObject and attaches its id", async () => {
    const { doc, objects } = seedDoc([
      { type: "Rect", id: "r1", left: 5, top: 6, width: 10, height: 10, fill: "#112233" },
    ]);
    const canvas = makeCanvas();
    const adapter = new FabricCanvasAdapter(canvas);
    const binding = new ObjectBinding(doc, objects, adapter);
    binding.reconcileToCanvas();
    await new Promise((r) => setTimeout(r, 50));

    const live = canvas.getObjects()[0];
    const json = adapter.toObject(live as unknown as ObjectJSON);
    expect(json.id).toBe("r1");
    expect(json.type).toBe("Rect");
    // The serialized JSON is plain — it must NOT itself be serializable again.
    expect(typeof (json as { toObject?: unknown }).toObject).toBe("undefined");
  });
});
