import * as Y from "yjs";
import { getSlides, yMapToSlideContent, SLIDE_FIELDS } from "./schema";
import type { SlideContent } from "@shared/types/slide";

/**
 * JSONB projection of the Yjs doc (ADR-0011).
 *
 * The Yjs doc is the source of truth for live editing; `slides.content` (JSONB)
 * is a materialized projection used for display, export, and non-collab viewing.
 * The server persists only opaque Yjs updates (it never interprets the CRDT), so
 * the canonical slide state is projected back to the JSONB store *by a client*,
 * debounced, reusing the existing `slidesApi.updateContent` autosave path.
 *
 * This module holds the pure projection helper so it is unit-testable without a
 * network or React.
 */

/** One slide's canonical projection: its stable id + materialized content. */
export interface SlideProjection {
  id: string;
  position: number;
  content: SlideContent;
}

/**
 * Projects the whole doc into an ordered list of `{ id, position, content }`.
 * Slides without an id are skipped (a slide map is only meaningful once seeded
 * with its stable id).
 *
 * The output is deduplicated by id: the first Y.Map seen for a given id wins and
 * any later duplicate is dropped. A Y.Array carries no unique-key constraint, so
 * a concurrent seed / merge could in principle leave two entries sharing an id;
 * this projection is the single materialization point feeding the slide store
 * and React keys, so collapsing duplicates here is the last-line guard against
 * the "two children with the same key" render crash (#132). The primary fix is
 * upstream (id-keyed, sync-gated seeding) — this keeps the UI correct regardless.
 */
export function projectDoc(doc: Y.Doc): SlideProjection[] {
  const out: SlideProjection[] = [];
  const seen = new Set<string>();
  getSlides(doc).forEach((slide, i) => {
    const id = slide.get(SLIDE_FIELDS.id) as string | undefined;
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push({
      id,
      position: (slide.get(SLIDE_FIELDS.position) as number | undefined) ?? i,
      content: yMapToSlideContent(slide),
    });
  });
  return out;
}
