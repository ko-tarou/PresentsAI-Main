import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import pptxgen from "pptxgenjs";
import { parsePptx } from "./pptxImport";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

// The vitest env is jsdom, which provides a spec-compliant DOMParser — the same
// one parsePptx uses by default in the browser. We pass it explicitly so the
// test exercises the real production parsing path (no injected stub parser).
const xmlParser = (xml: string) =>
  new DOMParser().parseFromString(xml, "application/xml");

const A = "http://schemas.openxmlformats.org/drawingml/2006/main";

/** A 16:9 PPTX (12192000 x 6858000 EMU) — the modern default. */
const SLIDE_W_EMU = 12192000;
const SLIDE_H_EMU = 6858000;

function presentationXml(): string {
  return `<?xml version="1.0"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldSz cx="${SLIDE_W_EMU}" cy="${SLIDE_H_EMU}"/>
</p:presentation>`;
}

/** A slide with one title text box (bold, centered, red) and one picture. */
function slideXml(): string {
  return `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="${A}"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="EEF2FF"/></a:solidFill></p:bgPr></p:bg>
    <p:spTree>
      <p:sp>
        <p:spPr>
          <a:xfrm>
            <a:off x="1219200" y="685800"/>
            <a:ext cx="9753600" cy="1371600"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r>
              <a:rPr lang="ja-JP" sz="4400" b="1">
                <a:solidFill><a:srgbClr val="FF0000"/></a:solidFill>
                <a:latin typeface="Meiryo"/>
              </a:rPr>
              <a:t>Hello PPTX</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:pic>
        <p:blipFill>
          <a:blip r:embed="rId2"/>
        </p:blipFill>
        <p:spPr>
          <a:xfrm>
            <a:off x="6096000" y="3429000"/>
            <a:ext cx="3048000" cy="2286000"/>
          </a:xfrm>
        </p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
</p:sld>`;
}

function slideRelsXml(): string {
  return `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
    Target="../media/image1.png"/>
</Relationships>`;
}

/** Minimal 1x1 transparent PNG. */
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function buildPptx(): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("ppt/presentation.xml", presentationXml());
  zip.file("ppt/slides/slide1.xml", slideXml());
  zip.file("ppt/slides/_rels/slide1.xml.rels", slideRelsXml());
  zip.file("ppt/media/image1.png", PNG_BASE64, { base64: true });
  return zip.generateAsync({ type: "uint8array" });
}

describe("parsePptx", () => {
  it("produces one editable SlideContent per slide", async () => {
    const data = await buildPptx();
    const { slides, warnings } = await parsePptx(data, xmlParser);

    expect(slides).toHaveLength(1);
    expect(warnings).toEqual([]);
    expect(slides[0].version).toBe("6.0.0");
  });

  it("imports the title as an editable Textbox with mapped position & format", async () => {
    const { slides } = await parsePptx(await buildPptx(), xmlParser);
    const objs = slides[0].objects as Array<Record<string, unknown>>;

    const textbox = objs.find((o) => o.type === "Textbox");
    expect(textbox).toBeTruthy();
    expect(textbox!.text).toBe("Hello PPTX");
    expect(textbox!.editable).toBe(true);
    expect(textbox!.fontWeight).toBe("bold");
    expect(textbox!.textAlign).toBe("center");
    expect(textbox!.fill).toBe("#ff0000");
    expect(textbox!.fontFamily).toBe("Meiryo");

    // off x=1219200 EMU on a 12192000-EMU-wide slide -> 10% of SLIDE_WIDTH.
    expect(textbox!.left).toBeCloseTo(SLIDE_WIDTH * 0.1, 1);
    expect(textbox!.top).toBeCloseTo(SLIDE_HEIGHT * 0.1, 1);
    expect(textbox!.width).toBeCloseTo(SLIDE_WIDTH * 0.8, 1);

    // 44pt -> ~ (44/72 in) * (SLIDE_HEIGHT / 7.5in) px. Positive, plausible.
    expect(textbox!.fontSize as number).toBeGreaterThan(40);
    expect(textbox!.fontSize as number).toBeLessThan(120);
  });

  it("imports the picture as a data-URL Image object placed on the canvas", async () => {
    const { slides } = await parsePptx(await buildPptx(), xmlParser);
    const objs = slides[0].objects as Array<Record<string, unknown>>;

    const image = objs.find((o) => o.type === "Image");
    expect(image).toBeTruthy();
    expect(String(image!.src)).toMatch(/^data:image\/png;base64,/);
    // off x=6096000 -> 50% of width, y=3429000 -> 50% of height.
    expect(image!.left).toBeCloseTo(SLIDE_WIDTH * 0.5, 1);
    expect(image!.top).toBeCloseTo(SLIDE_HEIGHT * 0.5, 1);

    // The fixture PNG is 1x1, so Fabric width/height must be the *natural* size
    // (1px) — NOT the EMU box. Forcing width/height to the box made Fabric treat
    // them as a crop window into the bitmap, which is what cropped the picture
    // and corrupted it on drag/resize. The footprint is carried by scaleX/scaleY.
    expect(image!.width).toBe(1);
    expect(image!.height).toBe(1);

    // ext 3048000 -> 25% of SLIDE_WIDTH, 2286000 -> ~33% of SLIDE_HEIGHT.
    // With a 1px natural image, scale == that pixel footprint.
    const footprintW = (image!.scaleX as number) * (image!.width as number);
    const footprintH = (image!.scaleY as number) * (image!.height as number);
    expect(footprintW).toBeCloseTo(SLIDE_WIDTH * 0.25, 1);
    expect(footprintH).toBeCloseTo(SLIDE_HEIGHT * (2286000 / SLIDE_H_EMU), 1);
  });

  // Regression guard for the "moves -> garbles" bug: every imported object must
  // carry geometry that stays self-consistent under Fabric transforms. Images in
  // particular must have width/height = natural bitmap size with a finite, >0
  // scale, never width/height pinned to the layout box (which made Fabric crop).
  it("gives every imported object move/resize-safe geometry", async () => {
    const { slides } = await parsePptx(await buildPptx(), xmlParser);
    const objs = slides[0].objects as Array<Record<string, unknown>>;

    for (const o of objs) {
      // No NaN / non-finite coordinates that would explode on drag.
      for (const k of ["left", "top", "width", "height", "scaleX", "scaleY"]) {
        if (o[k] !== undefined) {
          expect(Number.isFinite(o[k] as number)).toBe(true);
        }
      }
      if (o.type === "Image") {
        // Natural-size width/height + positive scale == clean transform target.
        expect(o.width as number).toBeGreaterThan(0);
        expect(o.height as number).toBeGreaterThan(0);
        expect(o.scaleX as number).toBeGreaterThan(0);
        expect(o.scaleY as number).toBeGreaterThan(0);
      }
    }
  });

  it("reads the slide solid-fill background", async () => {
    const { slides } = await parsePptx(await buildPptx(), xmlParser);
    expect(slides[0].background).toBe("#eef2ff");
  });

  // Regression: the hand-written fixtures above are far simpler than what real
  // tools emit. PowerPoint/Keynote/pptxgenjs decks carry extra wrapper elements
  // (p:nvGrpSpPr, p:grpSpPr, a:endParaRPr, a:lstStyle, prstGeom, ...) and put the
  // run color/format inside richer trees. This builds a deck with the actual
  // pptxgenjs serializer so the walker is exercised against real-world structure
  // — text, a solid-fill shape, an embedded image, and a slide background.
  it("parses a real pptxgenjs-generated deck (text + shape + image + bg)", async () => {
    const pres = new pptxgen();
    const s1 = pres.addSlide();
    s1.addText("Real Title", {
      x: 1, y: 1, w: 8, h: 1.5, fontSize: 40, bold: true, color: "FF0000", align: "center",
    });
    s1.addText("Body line", { x: 1, y: 3, w: 8, h: 1, fontSize: 20 });
    const s2 = pres.addSlide();
    s2.background = { color: "EEF2FF" };
    s2.addShape(pres.ShapeType.rect, { x: 5, y: 4, w: 2, h: 1, fill: { color: "00AA88" } });
    const png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    s2.addImage({ data: `data:image/png;base64,${png}`, x: 1, y: 1, w: 2, h: 2 });

    const buf = (await pres.write({ outputType: "arraybuffer" })) as ArrayBuffer;
    const { slides, warnings } = await parsePptx(buf, xmlParser);

    expect(slides).toHaveLength(2);
    expect(warnings).toEqual([]);

    const s1objs = slides[0].objects as Array<Record<string, unknown>>;
    const title = s1objs.find((o) => o.text === "Real Title");
    expect(title).toBeTruthy();
    expect(title!.type).toBe("Textbox");
    expect(title!.fontWeight).toBe("bold");
    expect(title!.textAlign).toBe("center");
    expect(title!.fill).toBe("#ff0000");

    const s2objs = slides[1].objects as Array<Record<string, unknown>>;
    expect(slides[1].background).toBe("#eef2ff");
    expect(s2objs.some((o) => o.type === "Image")).toBe(true);
    const rect = s2objs.find((o) => o.type === "Rect");
    expect(rect).toBeTruthy();
    expect(rect!.fill).toBe("#00aa88");
  });

  it("warns and returns empty when there are no slides", async () => {
    const zip = new JSZip();
    zip.file("ppt/presentation.xml", presentationXml());
    const { slides, warnings } = await parsePptx(
      await zip.generateAsync({ type: "uint8array" }),
      xmlParser,
    );
    expect(slides).toEqual([]);
    expect(warnings.length).toBeGreaterThan(0);
  });
});
