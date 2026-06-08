import type { Canvas, FabricObject } from "fabric";

/**
 * Stable per-object identity for slides.
 *
 * Fabric objects have no persistent identity of their own: their index in the
 * canvas object list shifts whenever objects are added, removed, or reordered.
 * Element animations reference a target object, so they need an id that:
 *  - survives serialization (round-trips through toJSON / loadFromJSON), and
 *  - never changes once assigned.
 *
 * We attach a custom `id` property to every object and include it in the
 * serialized JSON (see `toJSON` in ./canvas). Older slides saved before ids
 * existed are back-filled on load so they keep working.
 */

const OBJECT_ID_PREFIX = "obj-";

/** Properties added to fabric's default serialization so ids round-trip. */
export const CUSTOM_OBJECT_PROPERTIES = ["id"] as const;

function newObjectId(): string {
  // crypto.randomUUID is available in browsers and Node 19+; fall back to a
  // timestamp + random suffix for older/jsdom environments used in tests.
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${OBJECT_ID_PREFIX}${rand}`;
}

type WithId = FabricObject & { id?: string };

/** Return the object's stable id, assigning a fresh one if it has none. */
export function ensureObjectId(obj: FabricObject): string {
  const o = obj as WithId;
  if (typeof o.id === "string" && o.id.length > 0) return o.id;
  const id = newObjectId();
  o.set?.("id", id);
  o.id = id;
  return id;
}

/** Back-fill stable ids on every object currently on the canvas. */
export function ensureObjectIds(canvas: Canvas): void {
  canvas.getObjects().forEach((o) => ensureObjectId(o));
}

/** Find the object carrying the given stable id, or null if absent. */
export function findObjectById(canvas: Canvas, id: string): FabricObject | null {
  return canvas.getObjects().find((o) => (o as WithId).id === id) ?? null;
}
