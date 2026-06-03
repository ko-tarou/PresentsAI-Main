import { Canvas, Textbox } from "fabric";

export function addBulletList(canvas: Canvas, items: string[]): Textbox {
  const text = items.map((item, i) => `${i + 1}. ${item}`).join("\n");
  const tb = new Textbox(text, {
    left: 80, top: 100, width: 600, fontSize: 20, fill: "#212529", lineHeight: 1.6,
  });
  canvas.add(tb); canvas.setActiveObject(tb); canvas.renderAll();
  return tb;
}

export function convertToUnorderedList(canvas: Canvas): void {
  const obj = canvas.getActiveObject();
  if (!(obj instanceof Textbox)) return;
  const lines = obj.text?.split("\n") ?? [];
  const bulleted = lines.map(l => l.startsWith("• ") ? l : `• ${l.replace(/^\d+\.\s*/, "")}`).join("\n");
  obj.set("text", bulleted);
  canvas.renderAll();
}

export function setLineHeight(canvas: Canvas, lineHeight: number): void {
  const obj = canvas.getActiveObject();
  if (obj instanceof Textbox) {
    obj.set("lineHeight", lineHeight);
    canvas.renderAll();
  }
}

export function setLetterSpacing(canvas: Canvas, spacing: number): void {
  const obj = canvas.getActiveObject();
  if (obj instanceof Textbox) {
    obj.set("charSpacing", spacing * 100);
    canvas.renderAll();
  }
}
