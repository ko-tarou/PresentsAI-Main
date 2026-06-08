import * as Y from "yjs";
import {
  SLIDE_FIELDS,
  objectToYMap,
  type YObjectMap,
  type YSlideMap,
} from "./schema";

/**
 * Two-way binding between a Fabric canvas and the shared Yjs doc (ADR-0011).
 *
 * The Yjs doc is the source of truth; this module keeps a single slide's Fabric
 * canvas and the slide-list structure in sync with it, in both directions, and
 * — crucially — without looping.
 *
 * Loop prevention has two independent guards:
 *
 *  1. `LOCAL_ORIGIN` transaction tag. Every Fabric -> Yjs write runs inside
 *     `doc.transact(fn, LOCAL_ORIGIN)`. The Yjs observer ignores transactions
 *     whose origin is `LOCAL_ORIGIN`, so our own writes never bounce back into
 *     Fabric.
 *  2. `applyingRemote` re-entrancy flag. While a remote Yjs change is being
 *     applied to the canvas, the canvas fires its own object:added/modified/
 *     removed events; the Fabric -> Yjs path checks this flag and bails, so a
 *     remote edit never gets written back to Yjs.
 *
 * Editing conflicts are left to Yjs' CRDT (commutative, idempotent merges).
 *
 * Fabric is abstracted behind the minimal {@link CanvasLike} interface so the
 * binding is exercised in unit tests without a real WebGL/canvas2d context, and
 * so the wiring in the editor hook stays a thin adapter.
 */

/** Transaction origin tag marking Yjs writes that originated locally (Fabric). */
export const LOCAL_ORIGIN = Symbol("presentsai:fabric");

/** Plain serialized fabric object (always carries a stable `id`). */
export type ObjectJSON = Record<string, unknown> & { id: string };

/** The slice of the Fabric Canvas API the binding depends on. */
export interface CanvasLike {
  /** All objects currently on the canvas, in z-order. */
  getObjects(): ObjectJSON[];
  /** Serialize one object to the same plain shape stored in Yjs. */
  toObject(obj: ObjectJSON): ObjectJSON;
  /** Construct + add a fabric object from a plain record. */
  addObject(json: ObjectJSON): void | Promise<void>;
  /** Remove the object carrying this stable id, if present. */
  removeObject(id: string): void;
  /** Apply a property patch to the object with this id, if present. */
  updateObject(id: string, patch: Record<string, unknown>): void;
  /** Request a repaint after a batch of remote changes. */
  requestRender(): void;
}

function objectId(o: ObjectJSON): string {
  return o.id;
}

/**
 * Binds one slide's `objects` Y.Array<Y.Map> to a Fabric canvas, both ways.
 *
 * Lifecycle: construct, then call {@link reconcileToCanvas} once to seed the
 * canvas from the doc; thereafter feed Fabric events through the `onObject*`
 * methods and let {@link observe} push remote changes back to the canvas.
 */
export class ObjectBinding {
  private applyingRemote = false;
  private readonly observer: (events: Y.YEvent<Y.Map<unknown>>[], txn: Y.Transaction) => void;

  constructor(
    private readonly doc: Y.Doc,
    private readonly objects: Y.Array<YObjectMap>,
    private readonly canvas: CanvasLike,
  ) {
    this.observer = (_events, txn) => {
      // Skip our own writes (origin guard #1) — they are already on the canvas.
      if (txn.origin === LOCAL_ORIGIN) return;
      this.reconcileToCanvas();
    };
  }

  /** Start listening for remote (non-local) changes to this slide's objects. */
  observe(): void {
    this.objects.observeDeep(this.observer);
  }

  /** Stop listening. Safe to call multiple times. */
  unobserve(): void {
    this.objects.unobserveDeep(this.observer);
  }

  /** True while a remote Yjs change is being applied to the canvas. */
  get isApplyingRemote(): boolean {
    return this.applyingRemote;
  }

  private indexOfId(id: string): number {
    for (let i = 0; i < this.objects.length; i++) {
      if (this.objects.get(i).get("id") === id) return i;
    }
    return -1;
  }

  // ---- Fabric -> Yjs ------------------------------------------------------

  /** Mirror a freshly added fabric object into the doc (unless remote-applying). */
  onObjectAdded(obj: ObjectJSON): void {
    if (this.applyingRemote) return;
    const json = this.canvas.toObject(obj);
    const id = objectId(json);
    this.doc.transact(() => {
      if (this.indexOfId(id) === -1) this.objects.push([objectToYMap(json)]);
    }, LOCAL_ORIGIN);
  }

  /** Mirror a modified fabric object's properties into its Y.Map. */
  onObjectModified(obj: ObjectJSON): void {
    if (this.applyingRemote) return;
    const json = this.canvas.toObject(obj);
    const id = objectId(json);
    this.doc.transact(() => {
      const idx = this.indexOfId(id);
      if (idx === -1) {
        this.objects.push([objectToYMap(json)]);
        return;
      }
      const map = this.objects.get(idx);
      for (const [k, v] of Object.entries(json)) {
        if (map.get(k) !== v) map.set(k, v);
      }
    }, LOCAL_ORIGIN);
  }

  /** Remove the object's Y.Map from the doc. */
  onObjectRemoved(obj: ObjectJSON): void {
    if (this.applyingRemote) return;
    const id = objectId(obj);
    this.doc.transact(() => {
      const idx = this.indexOfId(id);
      if (idx !== -1) this.objects.delete(idx, 1);
    }, LOCAL_ORIGIN);
  }

  // ---- Yjs -> Fabric ------------------------------------------------------

  /**
   * Make the canvas match the doc: add missing objects, drop extra ones, and
   * patch changed properties. Runs with the re-entrancy guard set so the
   * canvas' own mutation events do not write back to the doc (guard #2).
   */
  reconcileToCanvas(): void {
    this.applyingRemote = true;
    try {
      const docObjects = this.objects.map((m) => m.toJSON() as ObjectJSON);
      const docIds = new Set(docObjects.map(objectId));
      const canvasById = new Map(this.canvas.getObjects().map((o) => [objectId(o), o]));

      // Remove canvas objects no longer in the doc.
      for (const id of canvasById.keys()) {
        if (!docIds.has(id)) this.canvas.removeObject(id);
      }
      // Add or patch from the doc.
      for (const json of docObjects) {
        const id = objectId(json);
        if (canvasById.has(id)) {
          this.canvas.updateObject(id, json);
        } else {
          void this.canvas.addObject(json);
        }
      }
      this.canvas.requestRender();
    } finally {
      this.applyingRemote = false;
    }
  }
}

// ---- Slide-list structure binding -----------------------------------------

/** Minimal view of the slide list this binding mutates / reads from. */
export interface SlideListLike {
  /** Replace the materialized slide list (positions are taken from the doc). */
  setSlides(slides: { id: string; content: unknown; position: number }[]): void;
}

/**
 * Builds a Y.Map for a slide skeleton (no objects yet) used when adding slides
 * collaboratively. Object content syncs through {@link ObjectBinding}.
 */
export function slideSkeletonYMap(
  id: string,
  presentationId: string,
  position: number,
): YSlideMap {
  const map = new Y.Map<unknown>();
  map.set(SLIDE_FIELDS.id, id);
  map.set(SLIDE_FIELDS.presentationId, presentationId);
  map.set(SLIDE_FIELDS.position, position);
  map.set(SLIDE_FIELDS.version, "1.0");
  map.set(SLIDE_FIELDS.objects, new Y.Array<YObjectMap>());
  return map;
}

/**
 * Binds the slide list (add / delete / reorder) to the root slides Y.Array.
 * Structural ops run under {@link LOCAL_ORIGIN}; remote structural changes are
 * pushed to the supplied {@link SlideListLike}.
 */
export class SlideStructureBinding {
  private readonly observer: (event: Y.YArrayEvent<YSlideMap>, txn: Y.Transaction) => void;

  constructor(
    private readonly doc: Y.Doc,
    private readonly slides: Y.Array<YSlideMap>,
    private readonly target: SlideListLike,
  ) {
    this.observer = (_event, txn) => {
      if (txn.origin === LOCAL_ORIGIN) return;
      this.pushToTarget();
    };
  }

  observe(): void {
    this.slides.observe(this.observer);
  }

  unobserve(): void {
    this.slides.unobserve(this.observer);
  }

  private indexOfId(id: string): number {
    for (let i = 0; i < this.slides.length; i++) {
      if (this.slides.get(i).get("id") === id) return i;
    }
    return -1;
  }

  /** Local: insert a new slide skeleton at `position` (defaults to the end). */
  addSlide(id: string, presentationId: string, position?: number): void {
    this.doc.transact(() => {
      const pos = position ?? this.slides.length;
      this.slides.insert(pos, [slideSkeletonYMap(id, presentationId, pos)]);
      this.renumber();
    }, LOCAL_ORIGIN);
  }

  /** Local: remove the slide with this id. */
  removeSlide(id: string): void {
    this.doc.transact(() => {
      const idx = this.indexOfId(id);
      if (idx === -1) return;
      this.slides.delete(idx, 1);
      this.renumber();
    }, LOCAL_ORIGIN);
  }

  /** Local: move the slide with this id to `toIndex`. */
  moveSlide(id: string, toIndex: number): void {
    this.doc.transact(() => {
      const from = this.indexOfId(id);
      if (from === -1 || from === toIndex) return;
      const map = this.slides.get(from);
      // Detach + clone, since a Y type instance cannot live in two places.
      const clone = cloneSlideMap(map);
      this.slides.delete(from, 1);
      const dest = Math.max(0, Math.min(toIndex, this.slides.length));
      this.slides.insert(dest, [clone]);
      this.renumber();
    }, LOCAL_ORIGIN);
  }

  /** Re-derive each slide's `position` from its array index. Caller transacts. */
  private renumber(): void {
    for (let i = 0; i < this.slides.length; i++) {
      const m = this.slides.get(i);
      if (m.get(SLIDE_FIELDS.position) !== i) m.set(SLIDE_FIELDS.position, i);
    }
  }

  /** Project the doc's slide order/content into the materialized target. */
  pushToTarget(): void {
    const list = this.slides.map((m, i) => ({
      id: m.get(SLIDE_FIELDS.id) as string,
      position: (m.get(SLIDE_FIELDS.position) as number | undefined) ?? i,
      content: {
        version: (m.get(SLIDE_FIELDS.version) as string | undefined) ?? "1.0",
        background: m.get(SLIDE_FIELDS.background),
        objects:
          (m.get(SLIDE_FIELDS.objects) as Y.Array<YObjectMap> | undefined)?.map(
            (o) => o.toJSON(),
          ) ?? [],
      },
    }));
    this.target.setSlides(list);
  }
}

/** Deep-clone a slide Y.Map (used when reordering, which requires detach). */
function cloneSlideMap(map: YSlideMap): YSlideMap {
  const next = new Y.Map<unknown>();
  map.forEach((value, key) => {
    if (value instanceof Y.Array) {
      const arr = new Y.Array<YObjectMap>();
      arr.push(value.map((o) => objectToYMap((o as YObjectMap).toJSON())));
      next.set(key, arr);
    } else {
      next.set(key, value);
    }
  });
  return next;
}
