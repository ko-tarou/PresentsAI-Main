import { describe, it, expect, vi, beforeEach } from "vitest";
import { Path } from "fabric";
import { NodeEditor } from "./nodeEditor";
import type { Canvas } from "fabric";

function makeCanvas() {
  const objects: object[] = [];
  return {
    add: vi.fn((o: object) => objects.push(o)),
    remove: vi.fn((o: object) => {
      const i = objects.indexOf(o);
      if (i >= 0) objects.splice(i, 1);
    }),
    renderAll: vi.fn(),
    _objects: objects,
  };
}

describe("NodeEditor", () => {
  let canvas: ReturnType<typeof makeCanvas>;
  let editor: NodeEditor;

  beforeEach(() => {
    canvas = makeCanvas();
    editor = new NodeEditor(canvas as unknown as Canvas);
  });

  it("adds one draggable handle per M/L/Q/C anchor point", () => {
    // M, L, Q, L -> 4 anchor points -> 4 handles.
    const path = new Path("M 0 0 L 10 0 Q 15 5 20 10 L 30 30", {
      left: 100,
      top: 50,
    });
    editor.edit(path);
    expect(canvas.add).toHaveBeenCalledTimes(4);
    expect(canvas._objects).toHaveLength(4);
  });

  it("offsets handles by the path's left/top origin", () => {
    const path = new Path("M 0 0 L 40 0", { left: 100, top: 200 });
    editor.edit(path);
    // First handle anchors at path origin (0,0) -> left = 100 + 0 - 6 (radius).
    const firstHandle = canvas._objects[0] as { left: number; top: number };
    expect(firstHandle.left).toBe(100 + 0 - 6);
    expect(firstHandle.top).toBe(200 + 0 - 6);
  });

  it("removes all handles on clear", () => {
    const path = new Path("M 0 0 L 10 10 L 20 20", { left: 0, top: 0 });
    editor.edit(path);
    expect(canvas._objects.length).toBeGreaterThan(0);
    editor.clear();
    expect(canvas._objects).toHaveLength(0);
  });

  it("replaces prior handles when editing a new path", () => {
    editor.edit(new Path("M 0 0 L 1 1", { left: 0, top: 0 })); // 2 handles
    editor.edit(new Path("M 0 0 L 1 1 L 2 2", { left: 0, top: 0 })); // 3 handles
    // Old handles cleared first, so only the latest path's handles remain.
    expect(canvas._objects).toHaveLength(3);
  });
});
