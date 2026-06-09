import * as Y from "yjs";
import type { Slide, SlideContent } from "@shared/types/slide";

/**
 * Yjs document model for collaborative editing.
 *
 * Design (see ADR-0011): the Yjs doc is the source of truth for live editing;
 * `slides.content` (JSONB) remains a materialized projection used for display
 * and export. This module only defines the shared-type schema and conversion
 * helpers — Fabric two-way binding lands in a later PR.
 *
 * Shape:
 *   doc
 *   └── "slides": Y.Array<Y.Map>            // ordered slide list
 *         └── slide: Y.Map {
 *               id, presentationId, position, notes?, ...meta,
 *               version: string,            // SlideContent.version
 *               background?: string,        // SlideContent.background
 *               objects: Y.Array<Y.Map>,    // fabric objects, one Y.Map each
 *             }
 */

/** Top-level key under which the ordered slide list is stored. */
export const SLIDES_KEY = "slides";

/** Y.Map keys that live on a slide map. */
export const SLIDE_FIELDS = {
  id: "id",
  presentationId: "presentationId",
  position: "position",
  notes: "notes",
  version: "version",
  background: "background",
  objects: "objects",
} as const;

export type YSlideMap = Y.Map<unknown>;
export type YObjectMap = Y.Map<unknown>;

/** Returns the root Y.Array holding the ordered slide maps. */
export function getSlides(doc: Y.Doc): Y.Array<YSlideMap> {
  return doc.getArray<YSlideMap>(SLIDES_KEY);
}

/** Builds a Y.Map for a single fabric object from a plain record. */
export function objectToYMap(obj: Record<string, unknown>): YObjectMap {
  const map = new Y.Map<unknown>();
  for (const [key, value] of Object.entries(obj)) {
    map.set(key, value);
  }
  return map;
}

/** Builds a Y.Map representing a slide (objects become a nested Y.Array<Y.Map>). */
export function slideToYMap(slide: Slide): YSlideMap {
  const map = new Y.Map<unknown>();
  map.set(SLIDE_FIELDS.id, slide.id);
  map.set(SLIDE_FIELDS.presentationId, slide.presentationId);
  map.set(SLIDE_FIELDS.position, slide.position);
  if (slide.notes !== undefined) map.set(SLIDE_FIELDS.notes, slide.notes);

  map.set(SLIDE_FIELDS.version, slide.content.version);
  if (slide.content.background !== undefined) {
    map.set(SLIDE_FIELDS.background, slide.content.background);
  }

  const objects = new Y.Array<YObjectMap>();
  objects.push(slide.content.objects.map((o) => objectToYMap(o)));
  map.set(SLIDE_FIELDS.objects, objects);

  return map;
}

/**
 * Populates the shared doc from a plain slide list. Runs inside a single
 * transaction so observers see one atomic update. Existing content is replaced.
 */
export function initializeDoc(doc: Y.Doc, slides: Slide[]): void {
  const arr = getSlides(doc);
  doc.transact(() => {
    if (arr.length > 0) arr.delete(0, arr.length);
    arr.push(slides.map((s) => slideToYMap(s)));
  });
}

/** Serializes a slide Y.Map back to the materialized `SlideContent` projection. */
export function yMapToSlideContent(slide: YSlideMap): SlideContent {
  const objects = slide.get(SLIDE_FIELDS.objects) as
    | Y.Array<YObjectMap>
    | undefined;
  const content: SlideContent = {
    version: (slide.get(SLIDE_FIELDS.version) as string | undefined) ?? "1.0",
    objects: objects
      ? objects.map((o) => o.toJSON() as Record<string, unknown>)
      : [],
  };
  const background = slide.get(SLIDE_FIELDS.background) as string | undefined;
  if (background !== undefined) content.background = background;
  return content;
}

/** Returns the slide Y.Map with the given id, or `undefined` if absent. */
export function findSlideMap(doc: Y.Doc, slideId: string): YSlideMap | undefined {
  return getSlides(doc).toArray().find(
    (s) => s.get(SLIDE_FIELDS.id) === slideId,
  );
}

/**
 * Overwrites a slide's content in the shared doc (objects + version +
 * background) with a restored `SlideContent`, leaving structural fields
 * (id, position, notes) untouched. Runs in one transaction so peers and the
 * local Fabric binding observe a single atomic update — this is how a restored
 * version becomes visible without breaking live collaboration (ADR-0011: the
 * Yjs doc is the source of truth, `slides.content` is the projection). Returns
 * false if the slide is not present in the doc.
 */
export function replaceSlideContent(
  doc: Y.Doc,
  slideId: string,
  content: SlideContent,
): boolean {
  const slide = findSlideMap(doc, slideId);
  if (!slide) return false;
  doc.transact(() => {
    slide.set(SLIDE_FIELDS.version, content.version);
    if (content.background !== undefined) {
      slide.set(SLIDE_FIELDS.background, content.background);
    }
    const objects = new Y.Array<YObjectMap>();
    objects.push(content.objects.map((o) => objectToYMap(o)));
    slide.set(SLIDE_FIELDS.objects, objects);
  });
  return true;
}

/** Serializes the whole doc back to an ordered list of `SlideContent`. */
export function docToSlideContents(doc: Y.Doc): SlideContent[] {
  return getSlides(doc).map((s) => yMapToSlideContent(s));
}
