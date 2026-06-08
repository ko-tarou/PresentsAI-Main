"use client";
import { useEffect } from "react";
import type { Canvas, FabricObject } from "fabric";
import * as Y from "yjs";
import { getSlides, SLIDE_FIELDS, type YObjectMap } from "@lib/collab/schema";
import { ObjectBinding, type ObjectJSON } from "@lib/collab/binding";
import { FabricCanvasAdapter } from "@lib/collab/fabricAdapter";

/**
 * Wires the active slide's Fabric canvas to its `objects` Y.Array, both ways.
 *
 * Rebuilds the binding whenever the canvas, doc, or active slide changes. Fabric
 * mutation events are routed to the binding (Fabric -> Yjs); the binding's own
 * observer pushes remote edits onto the canvas (Yjs -> Fabric). Loop prevention
 * is handled inside {@link ObjectBinding} (origin tag + re-entrancy guard).
 */
export function useObjectBinding(
  doc: Y.Doc | null,
  canvas: Canvas | null,
  activeSlideId: string | null,
) {
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
    binding.observe();
    // Seed the canvas from whatever the doc already holds for this slide.
    binding.reconcileToCanvas();

    const onAdded = (e: { target?: FabricObject }) =>
      e.target && binding.onObjectAdded(adapter.toObject(e.target as unknown as ObjectJSON));
    const onModified = (e: { target?: FabricObject }) =>
      e.target && binding.onObjectModified(adapter.toObject(e.target as unknown as ObjectJSON));
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
    };
  }, [doc, canvas, activeSlideId]);
}
