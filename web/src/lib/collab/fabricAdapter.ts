import { Canvas, FabricObject, util } from "fabric";
import { ensureObjectId, CUSTOM_OBJECT_PROPERTIES } from "@lib/fabric/objectId";
import type { CanvasLike, ObjectJSON } from "./binding";

/**
 * Adapts a real Fabric {@link Canvas} to the framework-agnostic
 * {@link CanvasLike} interface that {@link ObjectBinding} drives.
 *
 * Kept deliberately thin: it serializes/enlivens objects and looks them up by
 * the stable custom `id` (see lib/fabric/objectId). All loop-prevention lives
 * in the binding; this adapter is pure plumbing.
 */
export class FabricCanvasAdapter implements CanvasLike {
  constructor(private readonly canvas: Canvas) {}

  private withId(o: FabricObject): ObjectJSON {
    const id = ensureObjectId(o);
    return Object.assign(o.toObject([...CUSTOM_OBJECT_PROPERTIES]), { id }) as ObjectJSON;
  }

  private find(id: string): FabricObject | undefined {
    return this.canvas
      .getObjects()
      .find((o) => (o as FabricObject & { id?: string }).id === id);
  }

  getObjects(): ObjectJSON[] {
    return this.canvas.getObjects().map((o) => this.withId(o));
  }

  toObject(obj: ObjectJSON): ObjectJSON {
    // `obj` here is the live FabricObject passed through from a canvas event.
    return this.withId(obj as unknown as FabricObject);
  }

  async addObject(json: ObjectJSON): Promise<void> {
    if (this.find(json.id)) return;
    const [obj] = await util.enlivenObjects<FabricObject>([json]);
    if (!obj) return;
    (obj as FabricObject & { id?: string }).id = json.id;
    obj.set?.("id", json.id);
    this.canvas.add(obj);
  }

  removeObject(id: string): void {
    const obj = this.find(id);
    if (obj) this.canvas.remove(obj);
  }

  updateObject(id: string, patch: Record<string, unknown>): void {
    const obj = this.find(id);
    if (!obj) return;
    // Geometry/style props only; `type`/`id` are immutable identity.
    const { type: _t, id: _i, ...rest } = patch;
    void _t;
    void _i;
    obj.set(rest);
    obj.setCoords();
  }

  requestRender(): void {
    this.canvas.requestRenderAll();
  }
}
