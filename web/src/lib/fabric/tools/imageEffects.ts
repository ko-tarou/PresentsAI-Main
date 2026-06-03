import { Canvas, FabricImage, filters as FabricFilters } from "fabric";

export function applyBrightness(canvas: Canvas, value: number): void {
  const obj = canvas.getActiveObject();
  if (!(obj instanceof FabricImage)) return;
  const filter = new FabricFilters.Brightness({ brightness: value });
  obj.filters = obj.filters?.filter(f => !(f instanceof FabricFilters.Brightness)) ?? [];
  obj.filters.push(filter);
  obj.applyFilters();
  canvas.renderAll();
}

export function applyGrayscale(canvas: Canvas): void {
  const obj = canvas.getActiveObject();
  if (!(obj instanceof FabricImage)) return;
  obj.filters = [new FabricFilters.Grayscale()];
  obj.applyFilters();
  canvas.renderAll();
}

export function applyBlur(canvas: Canvas, blur: number): void {
  const obj = canvas.getActiveObject();
  if (!(obj instanceof FabricImage)) return;
  const filter = new FabricFilters.Blur({ blur });
  obj.filters = obj.filters?.filter(f => !(f instanceof FabricFilters.Blur)) ?? [];
  obj.filters.push(filter);
  obj.applyFilters();
  canvas.renderAll();
}

export function resetFilters(canvas: Canvas): void {
  const obj = canvas.getActiveObject();
  if (!(obj instanceof FabricImage)) return;
  obj.filters = [];
  obj.applyFilters();
  canvas.renderAll();
}
