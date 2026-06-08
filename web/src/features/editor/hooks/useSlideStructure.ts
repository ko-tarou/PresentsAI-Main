"use client";
import { useEffect, useMemo, useRef } from "react";
import * as Y from "yjs";
import { getSlides } from "@lib/collab/schema";
import { SlideStructureBinding, LOCAL_ORIGIN } from "@lib/collab/binding";
import { projectDoc } from "@lib/collab/projection";
import { useSlideStore } from "../stores/slideStore";
import { slidesApi } from "@shared/api/slides";
import type { Slide } from "@shared/types/slide";

/** Debounce window for projecting Yjs state back into the JSONB store. */
const PROJECTION_DELAY = 2000;

/**
 * Wires collaborative slide-list structure (add / remove / move) to the shared
 * Yjs doc, and materializes the canonical slide state back into `slides.content`
 * (JSONB) on a debounce (ADR-0011 projection).
 *
 * Returns structural ops the editor UI (SlidePanel / SlideSorter) calls; each
 * runs through {@link SlideStructureBinding} so the change syncs to every peer.
 * Remote structural changes are merged into the local slide store, preserving
 * per-slide metadata (thumbnail, notes, transition) that lives outside the doc.
 */
export function useSlideStructure(
  doc: Y.Doc | null,
  presentationId: string | null,
  accessToken: string | null,
) {
  const bindingRef = useRef<SlideStructureBinding | null>(null);
  const projectRef = useRef<(() => void) | null>(null);
  const projectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!doc) return;
    const slides = getSlides(doc);

    // Project the canonical doc state into JSONB, debounced. Scoped to
    // *structural* changes (add / remove / move): per-slide object-content
    // autosave is already owned by useCanvas, so persisting only structure here
    // avoids N-fold write amplification on every object edit.
    const scheduleProjection = () => {
      if (!presentationId || !accessToken) return;
      if (projectTimer.current) clearTimeout(projectTimer.current);
      projectTimer.current = setTimeout(() => {
        const proj = projectDoc(doc);
        // Persist new ordering for all slides, and content for slides the local
        // editor may not have an open canvas for (e.g. remotely added).
        const positions: Record<string, number> = {};
        proj.forEach((p) => { positions[p.id] = p.position; });
        void slidesApi.reorder(accessToken, presentationId, positions).catch(() => {});
        for (const p of proj) {
          void slidesApi
            .updateContent(accessToken, presentationId, p.id, p.content)
            .catch(() => { /* ignore network errors during projection autosave */ });
        }
      }, PROJECTION_DELAY);
    };

    // Structural change -> merge order/content into the local store (keeping
    // fields the doc does not track: thumbnailUrl, notes, meta) and schedule a
    // JSONB projection. Local ops (LOCAL_ORIGIN) are filtered by the binding's
    // observer, so this only fires for *remote* structural changes; local ops
    // are projected explicitly via the returned methods below.
    const binding = new SlideStructureBinding(doc, slides, {
      setSlides: () => {
        const projection = projectDoc(doc);
        const prev = useSlideStore.getState().slides;
        const byId = new Map(prev.map((s) => [s.id, s]));
        const next: Slide[] = projection.map((p) => {
          const existing = byId.get(p.id);
          return {
            ...(existing ?? {
              id: p.id,
              presentationId: presentationId ?? "",
              notes: undefined,
              thumbnailUrl: undefined,
              createdAt: "",
              updatedAt: "",
            }),
            position: p.position,
            content: p.content,
          } as Slide;
        });
        useSlideStore.getState().setSlides(next);
        scheduleProjection();
      },
    });
    binding.observe();
    bindingRef.current = binding;
    projectRef.current = scheduleProjection;

    return () => {
      binding.unobserve();
      bindingRef.current = null;
      projectRef.current = null;
      if (projectTimer.current) clearTimeout(projectTimer.current);
    };
  }, [doc, presentationId, accessToken]);

  return useMemo(
    () => ({
      /** Insert a new slide skeleton at `position` (defaults to the end). */
      addSlide: (id: string, position?: number) => {
        if (!presentationId) return;
        bindingRef.current?.addSlide(id, presentationId, position);
        projectRef.current?.();
      },
      /** Remove the slide with this id from the shared doc. */
      removeSlide: (id: string) => {
        bindingRef.current?.removeSlide(id);
        projectRef.current?.();
      },
      /** Move the slide with this id to `toIndex`. */
      moveSlide: (id: string, toIndex: number) => {
        bindingRef.current?.moveSlide(id, toIndex);
        projectRef.current?.();
      },
      /** True once the binding is live (doc connected). */
      get ready() {
        return bindingRef.current !== null;
      },
    }),
    [presentationId],
  );
}

export { LOCAL_ORIGIN };
