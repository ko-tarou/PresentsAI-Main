import { Canvas, loadSVGFromString } from "fabric";

export async function importSVG(canvas: Canvas, svgString: string): Promise<void> {
  const { objects } = await loadSVGFromString(svgString);
  const validObjects = objects.filter(Boolean);
  validObjects.forEach(obj => { if (obj) canvas.add(obj); });
  if (validObjects.length > 0 && validObjects[0]) canvas.setActiveObject(validObjects[0]);
  canvas.renderAll();
}

export async function importSVGFile(canvas: Canvas, file: File): Promise<void> {
  const text = await file.text();
  await importSVG(canvas, text);
}
