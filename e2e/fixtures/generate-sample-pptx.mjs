// Regenerates fixtures/sample.pptx — the 2-slide deck used by the PPTX import
// E2E regression (tests/pptx-import.spec.ts). Run from the repo root with the
// web app's pptxgenjs available:
//
//   node e2e/fixtures/generate-sample-pptx.mjs
//
// The committed .pptx is the source of truth for the test; this script only
// exists so the fixture can be reproduced/edited deterministically.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(here, "../../web/package.json"));
const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();
pptx.defineLayout({ name: "W16x9", width: 10, height: 5.625 });
pptx.layout = "W16x9";

const s1 = pptx.addSlide();
s1.background = { color: "EEF2FF" };
s1.addText("E2E インポートテスト", {
  x: 1, y: 0.6, w: 8, h: 1.2, fontSize: 40, bold: true, color: "1A1A1A", align: "center",
});
s1.addText("本文テキスト: PPTX import regression", {
  x: 1, y: 2.2, w: 8, h: 0.8, fontSize: 20, color: "333333",
});
s1.addShape(pptx.ShapeType.rect, { x: 1, y: 3.4, w: 3, h: 1.2, fill: { color: "4A90E2" } });

const s2 = pptx.addSlide();
s2.addText("2枚目のスライド", { x: 1, y: 1, w: 8, h: 1, fontSize: 32, bold: true, color: "222222" });
s2.addText("Second slide body text", { x: 1, y: 2.4, w: 8, h: 0.8, fontSize: 18, color: "555555" });

const buf = await pptx.write({ outputType: "nodebuffer" });
const out = path.resolve(here, "sample.pptx");
writeFileSync(out, buf);
console.log(`wrote ${out} (${buf.length} bytes)`);
