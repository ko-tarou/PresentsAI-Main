import { describe, it, expect, vi } from "vitest";
import JSZip from "jszip";
import { importPptxAsPresentation } from "./importPresentation";

const A = "http://schemas.openxmlformats.org/drawingml/2006/main";

function slideXml(text: string): string {
  return `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="${A}">
  <p:cSld><p:spTree>
    <p:sp><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="1000000"/></a:xfrm></p:spPr>
      <p:txBody><a:p><a:r><a:rPr sz="2400"/><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>
  </p:spTree></p:cSld>
</p:sld>`;
}

async function buildPptx(n: number): Promise<File> {
  const zip = new JSZip();
  zip.file(
    "ppt/presentation.xml",
    `<?xml version="1.0"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldSz cx="9144000" cy="6858000"/></p:presentation>`,
  );
  for (let i = 1; i <= n; i++) {
    zip.file(`ppt/slides/slide${i}.xml`, slideXml(`Slide ${i}`));
  }
  const bytes = await zip.generateAsync({ type: "arraybuffer" });
  const file = new File([bytes], "deck.pptx", {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  // jsdom's File doesn't implement arrayBuffer(); browsers do. Polyfill it so
  // the test exercises the real (browser) code path.
  if (typeof file.arrayBuffer !== "function") {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => bytes.slice(0),
    });
  }
  return file;
}

describe("importPptxAsPresentation", () => {
  it("creates a presentation and one filled slide per PPTX slide", async () => {
    const file = await buildPptx(3);

    const createPresentation = vi.fn(async () => ({
      id: "pres-1",
      ownerId: "u",
      title: "deck",
      thumbnailUrl: "",
      slideCount: 1,
      createdAt: "",
      updatedAt: "",
    }));
    // New presentation comes with one default slide "s-default".
    const listSlides = vi.fn(async () => ({
      items: [{ id: "s-default" }] as never,
    }));
    let n = 0;
    const createSlide = vi.fn(async () => ({ id: `s-new-${n++}` }) as never);
    const updateContent = vi.fn(async () => ({}) as never);

    const res = await importPptxAsPresentation("tok", file, {
      api: { createPresentation, listSlides, createSlide, updateContent },
    });

    expect(res.presentationId).toBe("pres-1");
    expect(res.slideCount).toBe(3);
    // Title derived from the file name without extension.
    expect(createPresentation).toHaveBeenCalledWith("tok", "deck");
    // Slide 1 reuses the default slide; 2 more are created.
    expect(createSlide).toHaveBeenCalledTimes(2);
    // Every slide's content is persisted.
    expect(updateContent).toHaveBeenCalledTimes(3);

    // First updateContent targets the reused default slide and carries the
    // editable Textbox parsed from the PPTX.
    const firstCall = updateContent.mock.calls[0] as unknown as [
      string,
      string,
      string,
      { objects: Array<Record<string, unknown>> },
    ];
    expect(firstCall[2]).toBe("s-default");
    const objs = firstCall[3].objects;
    expect(objs.some((o) => o.type === "Textbox" && o.text === "Slide 1")).toBe(true);
  });

  it("reports progress from 0 to 1", async () => {
    const file = await buildPptx(2);
    const ratios: number[] = [];
    await importPptxAsPresentation("tok", file, {
      onProgress: (p) => ratios.push(p.ratio),
      api: {
        createPresentation: async () =>
          ({ id: "p", ownerId: "", title: "", thumbnailUrl: "", slideCount: 0, createdAt: "", updatedAt: "" }),
        listSlides: async () => ({ items: [] as never }),
        createSlide: async () => ({ id: "s" }) as never,
        updateContent: async () => ({}) as never,
      },
    });
    expect(ratios[0]).toBe(0);
    expect(ratios[ratios.length - 1]).toBe(1);
  });
});
