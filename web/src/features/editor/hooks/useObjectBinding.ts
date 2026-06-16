"use client";
import { useCallback, useEffect, useRef } from "react";
import type { Canvas, FabricObject } from "fabric";
import * as Y from "yjs";
import { getSlides, SLIDE_FIELDS, type YObjectMap } from "@lib/collab/schema";
import { ObjectBinding, type ObjectJSON } from "@lib/collab/binding";
import { FabricCanvasAdapter } from "@lib/collab/fabricAdapter";
import { findObjectById } from "@lib/fabric/objectId";

/** Restack a Fabric object to an absolute z-index, keeping the canvas in sync. */
function restackFabric(canvas: Canvas, id: string, toIndex: number): void {
  const obj = findObjectById(canvas, id);
  if (!obj) return;
  const max = canvas.getObjects().length - 1;
  canvas.moveObjectTo(obj, Math.max(0, Math.min(toIndex, max)));
  canvas.requestRenderAll();
}

/**
 * Wires the active slide's Fabric canvas to its `objects` Y.Array, both ways.
 *
 * Rebuilds the binding whenever the canvas, doc, or active slide changes. Fabric
 * mutation events are routed to the binding (Fabric -> Yjs); the binding's own
 * observer pushes remote edits onto the canvas (Yjs -> Fabric). Loop prevention
 * is handled inside {@link ObjectBinding} (origin tag + re-entrancy guard).
 *
 * Returns a `moveObject(id, toIndex)` callback used by the layers panel to change
 * z-order. It mutates the doc through the binding (so collaborators stay in sync;
 * the Y.Array order *is* the z-order) and restacks the local Fabric canvas to
 * match, since local-origin writes do not bounce back through the observer.
 */
export function useObjectBinding(
  doc: Y.Doc | null,
  canvas: Canvas | null,
  activeSlideId: string | null,
) {
  const bindingRef = useRef<ObjectBinding | null>(null);
  const canvasRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!doc || !canvas || !activeSlideId) return;

    const slides = getSlides(doc);
    const idx = slides.toArray().findIndex((s) => s.get(SLIDE_FIELDS.id) === activeSlideId);
    if (idx === -1) return;
    const objects = slides.get(idx).get(SLIDE_FIELDS.objects) as
      | Y.Array<YObjectMap>
      | undefined;
    if (!objects) return;

    const adapter = new FabricCanvasAdapter(canvas);
    const binding = new ObjectBinding(doc, objects, adapter);
    bindingRef.current = binding;
    canvasRef.current = canvas;
    binding.observe();
    // Seed the canvas from whatever the doc already holds for this slide.
    binding.reconcileToCanvas();

    // Pass the *live* FabricObject straight through. ObjectBinding serializes it
    // exactly once via `this.canvas.toObject(...)` (see binding.ts). Pre-calling
    // adapter.toObject here would serialize twice: the second call lands on the
    // already-plain JSON (which has no `.toObject` method) and throws
    // "o.toObject is not a function" — the crash seen when reconcileToCanvas
    // re-adds imported (e.g. PPTX) objects and fires object:added.
    const onAdded = (e: { target?: FabricObject }) =>
      e.target && binding.onObjectAdded(e.target as unknown as ObjectJSON);
    const onModified = (e: { target?: FabricObject }) =>
      e.target && binding.onObjectModified(e.target as unknown as ObjectJSON);
    const onRemoved = (e: { target?: FabricObject }) => {
      const id = (e.target as (FabricObject & { id?: string }) | undefined)?.id;
      if (id) binding.onObjectRemoved({ id });
    };

    canvas.on("object:added", onAdded);
    canvas.on("object:modified", onModified);
    canvas.on("object:removed", onRemoved);

    return () => {
      canvas.off("object:added", onAdded);
      canvas.off("object:modified", onModified);
      canvas.off("object:removed", onRemoved);
      binding.unobserve();
      bindingRef.current = null;
      canvasRef.current = null;
    };
  }, [doc, canvas, activeSlideId]);

  const moveObject = useCallback((id: string, toIndex: number) => {
    bindingRef.current?.moveObject(id, toIndex);
    if (canvasRef.current) restackFabric(canvasRef.current, id, toIndex);
  }, []);

  return { moveObject };
}
