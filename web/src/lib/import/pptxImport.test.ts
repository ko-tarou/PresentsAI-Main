import { describe, it, expect } from "vitest";
import JSZip from "jszip";
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
    // ext 3048000 -> 25% width, 2286000 -> ~33% height.
    expect(image!.width).toBeCloseTo(SLIDE_WIDTH * 0.25, 1);
  });

  it("reads the slide solid-fill background", async () => {
    const { slides } = await parsePptx(await buildPptx(), xmlParser);
    expect(slides[0].background).toBe("#eef2ff");
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
