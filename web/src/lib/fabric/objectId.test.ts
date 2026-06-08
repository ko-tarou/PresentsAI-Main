import { describe, it, expect } from "vitest";
import type { Canvas, FabricObject } from "fabric";
import {
  ensureObjectId,
  ensureObjectIds,
  findObjectById,
  CUSTOM_OBJECT_PROPERTIES,
} from "./objectId";

// Minimal fabric-object stand-in: ensureObjectId only touches `set` and `id`.
function makeObj(id?: string): FabricObject {
  const o: Record<string, unknown> = { id };
  o.set = (k: string, v: unknown) => {
    o[k] = v;
    return o;
  };
  return o as unknown as FabricObject;
}

function makeCanvas(objs: FabricObject[]): Canvas {
  return { getObjects: () => objs } as unknown as Canvas;
}

describe("objectId", () => {
  it("includes 'id' in the custom serialized properties", () => {
    expect(CUSTOM_OBJECT_PROPERTIES).toContain("id");
  });

  it("assigns a fresh id to an object that has none", () => {
    const obj = makeObj();
    const id = ensureObjectId(obj);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    expect((obj as unknown as { id: string }).id).toBe(id);
  });

  it("is idempotent: an existing id is preserved", () => {
    const obj = makeObj("obj-existing");
    expect(ensureObjectId(obj)).toBe("obj-existing");
    expect(ensureObjectId(obj)).toBe("obj-existing");
  });

  it("assigns unique ids to distinct objects", () => {
    const a = ensureObjectId(makeObj());
    const b = ensureObjectId(makeObj());
    expect(a).not.toBe(b);
  });

  it("back-fills ids on every object on the canvas", () => {
    const objs = [makeObj(), makeObj("obj-kept"), makeObj()];
    ensureObjectIds(makeCanvas(objs));
    const ids = objs.map((o) => (o as unknown as { id: string }).id);
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(ids[1]).toBe("obj-kept");
    expect(new Set(ids).size).toBe(3);
  });

  it("finds an object by its id and returns null when absent", () => {
    const target = makeObj("obj-target");
    const canvas = makeCanvas([makeObj("obj-other"), target]);
    expect(findObjectById(canvas, "obj-target")).toBe(target);
    expect(findObjectById(canvas, "obj-missing")).toBeNull();
  });
});
