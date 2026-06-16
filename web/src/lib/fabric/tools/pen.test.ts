import { describe, it, expect, vi, beforeEach } from "vitest";
import { Point, Path } from "fabric";
import { PenTool } from "./pen";
import type { Canvas } from "fabric";

/**
 * Fake canvas recording added/removed objects and the event handlers the
 * PenTool registers, so we can replay mouse events and inspect the resulting
 * Fabric Path geometry without a DOM canvas.
 */
function makeCanvas() {
  const handlers: Record<string, (e: { pointer?: Point }) => void> = {};
  const objects: object[] = [];
  return {
    isDrawingMode: false,
    selection: true,
    on: vi.fn((evt: string, fn: (e: { pointer?: Point }) => void) => {
      handlers[evt] = fn;
    }),
    off: vi.fn((evt: string) => {
      delete handlers[evt];
    }),
    add: vi.fn((o: object) => objects.push(o)),
    remove: vi.fn((o: object) => {
      const i = objects.indexOf(o);
      if (i >= 0) objects.splice(i, 1);
    }),
    setActiveObject: vi.fn(),
    renderAll: vi.fn(),
    _handlers: handlers,
    _objects: objects,
  };
}

function down(canvas: ReturnType<typeof makeCanvas>, x: number, y: number) {
  canvas._handlers["mouse:down"]({ pointer: new Point(x, y) });
}

describe("PenTool", () => {
  let canvas: ReturnType<typeof makeCanvas>;
  let pen: PenTool;

  beforeEach(() => {
    canvas = makeCanvas();
    pen = new PenTool(canvas as unknown as Canvas);
    pen.enable();
  });

  it("registers mouse handlers and disables free-draw on enable", () => {
    expect(canvas.isDrawingMode).toBe(false);
    expect(canvas.selection).toBe(false);
    expect(canvas._handlers["mouse:down"]).toBeTypeOf("function");
    expect(canvas._handlers["mouse:move"]).toBeTypeOf("function");
    expect(canvas._handlers["mouse:dblclick"]).toBeTypeOf("function");
  });

  it("finalizes a Path starting with a moveto at the first clicked point", () => {
    down(canvas, 10, 20);
    down(canvas, 40, 60);
    canvas._handlers["mouse:dblclick"]({});

    // The last added object is the finalized Path (preview paths are removed).
    const final = canvas._objects[canvas._objects.length - 1] as Path;
    expect(final).toBeInstanceOf(Path);
    const d = final.path.map((c) => c.join(" ")).join(" ");
    expect(d.startsWith("M 10 20")).toBe(true);
    // A second point produces a quadratic segment.
    expect(d).toContain("Q");
    expect(canvas.setActiveObject).toHaveBeenCalled();
  });

  it("does not finalize a path from a single point", () => {
    down(canvas, 5, 5);
    canvas._handlers["mouse:dblclick"]({});
    // No persisted Path was activated (needs >= 2 points).
    expect(canvas.setActiveObject).not.toHaveBeenCalled();
  });

  it("clears handlers and resets state on disable", () => {
    down(canvas, 1, 1);
    pen.disable();
    expect(canvas.selection).toBe(true);
    expect(canvas._handlers["mouse:down"]).toBeUndefined();
    expect(canvas._handlers["mouse:move"]).toBeUndefined();
  });
});
