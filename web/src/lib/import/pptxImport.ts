import JSZip from "jszip";
import type { SlideContent, FabricObject } from "@shared/types/slide";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

/**
 * PPTX -> editable PresentsAI slides (MVP).
 *
 * A .pptx is a ZIP (Open Packaging Conventions). Each slide lives at
 * `ppt/slides/slideN.xml` and references images through
 * `ppt/slides/_rels/slideN.xml.rels`. We unzip with JSZip, parse the slide XML
 * with the DOM (browser `DOMParser`, or an injected parser in tests), and walk
 * the DrawingML shape tree (`p:sp`, `p:pic`) into Fabric.js v6 object JSON so
 * every imported element lands on the canvas as a real, editable object —
 * text boxes stay editable text, pictures stay movable images — rather than a
 * flat rasterized slide.
 *
 * Coverage (MVP): text boxes (runs -> text, position, size, font size/color/
 * bold/italic/align), pictures (embedded image -> data-URL image object),
 * auto-shapes with a solid fill (-> rect), and per-slide solid background.
 * See the TODOs at the bottom of this file for what is intentionally deferred.
 */

/** EMU (English Metric Units) per inch — the PPTX absolute length unit. */
const EMU_PER_INCH = 914400;
/** PowerPoint default slide size in EMU when the presentation omits one (4:3, 10"x7.5"). */
const DEFAULT_SLIDE_W_EMU = 9144000;
const DEFAULT_SLIDE_H_EMU = 6858000;
/** Centipoints (1/100 pt) per point — DrawingML font sizes are in centipoints. */
const CENTIPOINTS_PER_POINT = 100;

export interface PptxImportResult {
  /** One SlideContent per PPTX slide, in document order. */
  slides: SlideContent[];
  /** Human-readable notes about what was skipped, for surfacing in the UI. */
  warnings: string[];
}

/** Minimal XML parser contract so the walker is testable without a browser. */
export type XmlParser = (xml: string) => Document;

function defaultXmlParser(xml: string): Document {
  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser is unavailable; pass an xmlParser explicitly");
  }
  return new DOMParser().parseFromString(xml, "application/xml");
}

/**
 * Parse a .pptx file into editable {@link SlideContent} objects.
 *
 * @param data    the raw .pptx bytes.
 * @param xmlParser injectable XML parser (defaults to browser DOMParser).
 */
export async function parsePptx(
  data: ArrayBuffer | Uint8Array,
  xmlParser: XmlParser = defaultXmlParser,
): Promise<PptxImportResult> {
  const zip = await JSZip.loadAsync(data);
  const warnings: string[] = [];

  const { wEmu, hEmu } = await readSlideSize(zip, xmlParser);
  const scaleX = SLIDE_WIDTH / wEmu;
  const scaleY = SLIDE_HEIGHT / hEmu;

  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort(bySlideNumber);

  if (slidePaths.length === 0) {
    warnings.push("プレゼンテーションにスライドが見つかりませんでした。");
    return { slides: [], warnings };
  }

  const slides: SlideContent[] = [];
  for (const path of slidePaths) {
    const xml = await zip.file(path)!.async("string");
    const doc = xmlParser(xml);
    const rels = await readRels(zip, path, xmlParser);
    const media = await readMedia(zip, rels);
    const content = await slideXmlToContent(doc, { scaleX, scaleY, media, warnings });
    slides.push(content);
  }

  return { slides, warnings };
}

interface SlideCtx {
  scaleX: number;
  scaleY: number;
  /** rId -> data URL for embedded images on this slide. */
  media: Map<string, string>;
  warnings: string[];
}

/** Convert one parsed slide XML document into Fabric SlideContent. */
async function slideXmlToContent(doc: Document, ctx: SlideCtx): Promise<SlideContent> {
  const objects: FabricObject[] = [];

  // Shapes (text boxes + auto-shapes) live under p:sp; pictures under p:pic.
  for (const sp of elements(doc, "sp")) {
    const obj = shapeToObject(sp, ctx);
    if (obj) objects.push(obj);
  }
  for (const pic of elements(doc, "pic")) {
    const obj = pictureToObject(pic, ctx);
    if (obj) objects.push(obj);
  }

  const background = readSlideBackground(doc);
  return { version: "6.0.0", objects, background };
}

/** Parse a `<p:sp>` into a Textbox (if it has text) or a filled Rect. */
function shapeToObject(sp: Element, ctx: SlideCtx): FabricObject | null {
  const xfrm = findXfrm(sp);
  const box = xfrm ? emuBox(xfrm, ctx) : null;

  const text = extractText(sp);
  if (text.trim().length > 0) {
    const fmt = firstRunFormat(sp, ctx);
    const left = box?.left ?? 0.1 * SLIDE_WIDTH;
    const top = box?.top ?? 0.1 * SLIDE_HEIGHT;
    const width = box?.width ?? 0.8 * SLIDE_WIDTH;
    return {
      type: "Textbox",
      version: "6.0.0",
      id: makeId(),
      left,
      top,
      width,
      text,
      fontSize: fmt.fontSize ?? 24,
      fontFamily: fmt.fontFamily ?? "sans-serif",
      fontWeight: fmt.bold ? "bold" : "normal",
      fontStyle: fmt.italic ? "italic" : "normal",
      underline: fmt.underline ?? false,
      fill: fmt.color ?? "#000000",
      textAlign: fmt.align ?? "left",
      editable: true,
    };
  }

  // No text: keep it only if it has an explicit solid fill (a real shape).
  const fill = solidFill(sp);
  if (fill && box) {
    return {
      type: "Rect",
      version: "6.0.0",
      id: makeId(),
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
      fill,
      stroke: "transparent",
      strokeWidth: 0,
      strokeUniform: true,
    };
  }

  return null;
}

/** Parse a `<p:pic>` into a Fabric Image backed by an embedded data URL. */
function pictureToObject(pic: Element, ctx: SlideCtx): FabricObject | null {
  const blip = first(pic, "blip");
  const embed =
    blip?.getAttribute("r:embed") ??
    blip?.getAttributeNS?.(R_NS, "embed") ??
    getAttrAnyNs(blip, "embed");
  if (!embed) return null;
  const dataUrl = ctx.media.get(embed);
  if (!dataUrl) {
    ctx.warnings.push("埋め込み画像を1件読み込めませんでした。");
    return null;
  }
  const xfrm = findXfrm(pic);
  const box = xfrm ? emuBox(xfrm, ctx) : null;
  // Fabric's Image, when loaded from JSON with explicit width/height, draws the
  // decoded bitmap into that logical box (scaleX/scaleY default to 1). So we map
  // the PPTX EMU extent straight onto width/height — the picture lands at the
  // right place and footprint, and stays a freely resizable image object.
  const obj: FabricObject = {
    type: "Image",
    version: "6.0.0",
    id: makeId(),
    left: box?.left ?? 0.1 * SLIDE_WIDTH,
    top: box?.top ?? 0.1 * SLIDE_HEIGHT,
    src: dataUrl,
    crossOrigin: "anonymous",
  };
  if (box) {
    obj.width = box.width;
    obj.height = box.height;
  }
  return obj;
}

/* --------------------------- DrawingML helpers --------------------------- */

const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Read the `<a:xfrm>` offset/extent and scale EMU -> canvas pixels. */
function emuBox(xfrm: Element, ctx: SlideCtx): Box {
  const off = first(xfrm, "off");
  const ext = first(xfrm, "ext");
  const x = num(off?.getAttribute("x"));
  const y = num(off?.getAttribute("y"));
  const cx = num(ext?.getAttribute("cx"));
  const cy = num(ext?.getAttribute("cy"));
  return {
    left: x * ctx.scaleX,
    top: y * ctx.scaleY,
    width: cx * ctx.scaleX,
    height: cy * ctx.scaleY,
  };
}

function findXfrm(sp: Element): Element | null {
  return first(sp, "xfrm");
}

/** Join all `<a:t>` text runs in a shape, preserving paragraph breaks. */
function extractText(sp: Element): string {
  const paras = elementsIn(sp, "p");
  if (paras.length === 0) {
    // Fallback: concatenate any stray <a:t>.
    return elementsIn(sp, "t").map((t) => t.textContent ?? "").join("");
  }
  return paras
    .map((p) => elementsIn(p, "t").map((t) => t.textContent ?? "").join(""))
    .join("\n");
}

interface RunFormat {
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  align?: string;
}

/**
 * Read formatting from the first text run / paragraph properties.
 *
 * Font size is in centipoints (1/100 pt). A point is 1/72". We convert to EMU
 * (pt * EMU_PER_INCH / 72) then through the same vertical EMU->pixel scale as
 * the shape geometry, so text scales consistently with its box.
 */
function firstRunFormat(sp: Element, ctx: SlideCtx): RunFormat {
  const fmt: RunFormat = {};
  const rPr = first(sp, "rPr");
  if (rPr) {
    const sz = num(rPr.getAttribute("sz"));
    if (sz > 0) {
      const pt = sz / CENTIPOINTS_PER_POINT;
      const emu = (pt * EMU_PER_INCH) / 72;
      fmt.fontSize = Math.round(emu * ctx.scaleY);
    }
    if (rPr.getAttribute("b") === "1") fmt.bold = true;
    if (rPr.getAttribute("i") === "1") fmt.italic = true;
    if (rPr.getAttribute("u") && rPr.getAttribute("u") !== "none") fmt.underline = true;
    const color = solidFillColor(rPr);
    if (color) fmt.color = color;
    const latin = first(rPr, "latin");
    const face = latin?.getAttribute("typeface");
    if (face) fmt.fontFamily = face;
  }
  const pPr = first(sp, "pPr");
  const algn = pPr?.getAttribute("algn");
  if (algn) fmt.align = mapAlign(algn);
  return fmt;
}

function mapAlign(algn: string): string {
  switch (algn) {
    case "ctr":
      return "center";
    case "r":
      return "right";
    case "just":
      return "justify";
    default:
      return "left";
  }
}

/** Read a shape's solid fill color as `#rrggbb`, if present. */
function solidFill(sp: Element): string | null {
  const spPr = first(sp, "spPr");
  return spPr ? solidFillColor(spPr) : null;
}

/** Pull the first `<a:solidFill><a:srgbClr val="RRGGBB"/>` under `el`. */
function solidFillColor(el: Element): string | null {
  const fill = first(el, "solidFill");
  if (!fill) return null;
  const srgb = first(fill, "srgbClr");
  const val = srgb?.getAttribute("val");
  if (val && /^[0-9a-fA-F]{6}$/.test(val)) return `#${val.toLowerCase()}`;
  return null;
}

/** Read a slide-level solid background fill (`<p:bg>`), or undefined. */
function readSlideBackground(doc: Document): string | undefined {
  const bg = first(doc.documentElement, "bg");
  if (!bg) return undefined;
  return solidFillColor(bg) ?? undefined;
}

/* ------------------------------ ZIP / rels ------------------------------ */

/** Read presentation slide size; falls back to 4:3 default. */
async function readSlideSize(
  zip: JSZip,
  parse: XmlParser,
): Promise<{ wEmu: number; hEmu: number }> {
  const file = zip.file("ppt/presentation.xml");
  if (!file) return { wEmu: DEFAULT_SLIDE_W_EMU, hEmu: DEFAULT_SLIDE_H_EMU };
  const doc = parse(await file.async("string"));
  const sldSz = first(doc.documentElement, "sldSz");
  const cx = num(sldSz?.getAttribute("cx"));
  const cy = num(sldSz?.getAttribute("cy"));
  return {
    wEmu: cx > 0 ? cx : DEFAULT_SLIDE_W_EMU,
    hEmu: cy > 0 ? cy : DEFAULT_SLIDE_H_EMU,
  };
}

/** Parse `slideN.xml.rels` into a rId -> target-path map. */
async function readRels(
  zip: JSZip,
  slidePath: string,
  parse: XmlParser,
): Promise<Map<string, string>> {
  const dir = slidePath.replace(/[^/]+$/, "");
  const name = slidePath.split("/").pop()!;
  const relsPath = `${dir}_rels/${name}.rels`;
  const file = zip.file(relsPath);
  const map = new Map<string, string>();
  if (!file) return map;
  const doc = parse(await file.async("string"));
  for (const rel of Array.from(doc.getElementsByTagName("Relationship"))) {
    const id = rel.getAttribute("Id");
    const target = rel.getAttribute("Target");
    if (id && target) {
      // Targets are relative to ppt/slides/, e.g. "../media/image1.png".
      map.set(id, normalizePath(`${dir}${target}`));
    }
  }
  return map;
}

/** Resolve each image relationship to a base64 data URL. */
async function readMedia(
  zip: JSZip,
  rels: Map<string, string>,
): Promise<Map<string, string>> {
  const media = new Map<string, string>();
  for (const [rId, path] of rels) {
    if (!/\.(png|jpe?g|gif|bmp|svg)$/i.test(path)) continue;
    const file = zip.file(path);
    if (!file) continue;
    const b64 = await file.async("base64");
    media.set(rId, `data:${mimeFor(path)};base64,${b64}`);
  }
  return media;
}

function mimeFor(path: string): string {
  const ext = path.split(".").pop()!.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "svg") return "image/svg+xml";
  return `image/${ext}`;
}

/** Collapse `..` segments so "ppt/slides/../media/x.png" -> "ppt/media/x.png". */
function normalizePath(p: string): string {
  const parts = p.split("/");
  const out: string[] = [];
  for (const seg of parts) {
    if (seg === "..") out.pop();
    else if (seg !== ".") out.push(seg);
  }
  return out.join("/");
}

/* ------------------------------ XML utils ------------------------------ */

/** All descendant elements with the given DrawingML/Presentation local name. */
function elements(doc: Document, local: string): Element[] {
  return Array.from(doc.getElementsByTagName("*")).filter(
    (el) => localName(el) === local,
  );
}

/** Descendants of `el` (inclusive scope) with the given local name. */
function elementsIn(el: Element, local: string): Element[] {
  return Array.from(el.getElementsByTagName("*")).filter(
    (e) => localName(e) === local,
  );
}

/** First descendant of `el` with the given local name, or null. */
function first(el: Element | null | undefined, local: string): Element | null {
  if (!el) return null;
  if (localName(el) === local) return el;
  for (const child of Array.from(el.getElementsByTagName("*"))) {
    if (localName(child) === local) return child;
  }
  return null;
}

/** Local name without namespace prefix (`p:sp` -> `sp`), parser-agnostic. */
function localName(el: Element): string {
  return el.localName ?? el.tagName.replace(/^.*:/, "");
}

function getAttrAnyNs(el: Element | null, local: string): string | null {
  if (!el) return null;
  for (const attr of Array.from(el.attributes)) {
    if (attr.localName === local || attr.name.replace(/^.*:/, "") === local) {
      return attr.value;
    }
  }
  return null;
}

function num(v: string | null | undefined): number {
  const n = v ? Number(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

function bySlideNumber(a: string, b: string): number {
  const na = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
  const nb = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
  return na - nb;
}

let idCounter = 0;
function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `obj-${crypto.randomUUID()}`;
  }
  return `obj-pptx-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

/*
 * Deferred (post-MVP) — tracked here so the boundary is explicit:
 *  - Native image sizing: pictures load at their natural size; we don't yet
 *    derive scaleX/scaleY to honor the PPTX extent box (see _emuW/_emuH hints).
 *  - Per-run rich text (mixed fonts/colors within one text box).
 *  - Non-solid fills (gradients, pattern, picture fills), theme color lookups.
 *  - Tables, charts, SmartArt, grouped shapes, connectors, freeform paths.
 *  - Rotation / flip from <a:xfrm rot=...>.
 *  - Slide master / layout placeholder inheritance (we read only slide XML).
 */
