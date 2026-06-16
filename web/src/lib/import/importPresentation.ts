import { parsePptx } from "./pptxImport";
import { presentationsApi } from "@shared/api/presentations";
import { slidesApi } from "@shared/api/slides";
import type { SlideContent } from "@shared/types/slide";

export interface ImportProgress {
  /** 0..1 fraction of slides persisted so far. */
  ratio: number;
  /** Short status label for the UI. */
  label: string;
}

export interface ImportPresentationResult {
  presentationId: string;
  slideCount: number;
  warnings: string[];
}

/**
 * High-level "import a .pptx as a new presentation" use case.
 *
 * Splits cleanly from {@link parsePptx} (pure, testable) so this layer only owns
 * the API orchestration: create a presentation, then create + fill one slide per
 * parsed slide. The slide APIs are injected so this is unit-testable without a
 * live backend.
 */
export async function importPptxAsPresentation(
  token: string,
  file: File,
  opts: {
    onProgress?: (p: ImportProgress) => void;
    api?: {
      createPresentation: typeof presentationsApi.create;
      listSlides: typeof slidesApi.list;
      createSlide: typeof slidesApi.create;
      updateContent: typeof slidesApi.updateContent;
    };
  } = {},
): Promise<ImportPresentationResult> {
  const api = opts.api ?? {
    createPresentation: presentationsApi.create,
    listSlides: slidesApi.list,
    createSlide: slidesApi.create,
    updateContent: slidesApi.updateContent,
  };
  const onProgress = opts.onProgress ?? (() => {});

  onProgress({ ratio: 0, label: "PPTX を解析中..." });
  const buf = await file.arrayBuffer();
  const { slides, warnings } = await parsePptx(buf);

  const title = file.name.replace(/\.pptx$/i, "") || "インポートしたプレゼン";
  const pres = await api.createPresentation(token, title);

  // A new presentation already has one empty slide; reuse it for slide 1, then
  // create the rest. If parsing yielded zero slides, leave the default slide.
  const contents: SlideContent[] = slides.length > 0 ? slides : [];
  for (let i = 0; i < contents.length; i++) {
    onProgress({
      ratio: i / contents.length,
      label: `スライドを生成中 (${i + 1}/${contents.length})`,
    });
    let slideId: string;
    if (i === 0) {
      // A new presentation already has one empty slide; reuse it for slide 1 so
      // we don't leave a stray blank slide at the front of the deck.
      const existing = await firstSlideId(token, pres.id, api.listSlides);
      slideId = existing ?? (await api.createSlide(token, pres.id)).id;
    } else {
      slideId = (await api.createSlide(token, pres.id)).id;
    }
    await api.updateContent(token, pres.id, slideId, contents[i]);
  }

  onProgress({ ratio: 1, label: "完了" });
  return { presentationId: pres.id, slideCount: contents.length, warnings };
}

/** Best-effort lookup of the default slide created with a new presentation. */
async function firstSlideId(
  token: string,
  presentationId: string,
  listSlides: typeof slidesApi.list,
): Promise<string | null> {
  try {
    const res = await listSlides(token, presentationId);
    return res.items[0]?.id ?? null;
  } catch {
    return null;
  }
}
