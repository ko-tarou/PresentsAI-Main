import { Canvas, FabricObject, ActiveSelection } from "fabric";

export function deleteSelected(canvas: Canvas) {
  const active = canvas.getActiveObjects();
  active.forEach((obj) => canvas.remove(obj));
  canvas.discardActiveObject();
  canvas.renderAll();
}

export function duplicateSelected(canvas: Canvas) {
  const active = canvas.getActiveObject();
  if (!active) return;
  active.clone().then((cloned: FabricObject) => {
    cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 });
    if (cloned instanceof ActiveSelection) {
      cloned.canvas = canvas;
      cloned.getObjects().forEach((obj) => canvas.add(obj));
      canvas.discardActiveObject();
    } else {
      canvas.add(cloned);
    }
    canvas.setActiveObject(cloned);
    canvas.renderAll();
  });
}

export function bringForward(canvas: Canvas) {
  const obj = canvas.getActiveObject();
  if (obj) { canvas.bringObjectForward(obj); canvas.renderAll(); }
}

export function sendBackward(canvas: Canvas) {
  const obj = canvas.getActiveObject();
  if (obj) { canvas.sendObjectBackwards(obj); canvas.renderAll(); }
}

export function bringToFront(canvas: Canvas) {
  const obj = canvas.getActiveObject();
  if (obj) { canvas.bringObjectToFront(obj); canvas.renderAll(); }
}

export function sendToBack(canvas: Canvas) {
  const obj = canvas.getActiveObject();
  if (obj) { canvas.sendObjectToBack(obj); canvas.renderAll(); }
}

export function alignObjects(canvas: Canvas, align: "left" | "center" | "right" | "top" | "middle" | "bottom") {
  const objs = canvas.getActiveObjects();
  if (objs.length < 2) return;
  const bounds = canvas.getActiveObject()?.getBoundingRect();
  if (!bounds) return;
  objs.forEach((obj) => {
    switch (align) {
      case "left":   obj.set({ left: bounds.left }); break;
      case "center": obj.set({ left: bounds.left + bounds.width / 2 - (obj.width ?? 0) / 2 }); break;
      case "right":  obj.set({ left: bounds.left + bounds.width - (obj.width ?? 0) }); break;
      case "top":    obj.set({ top: bounds.top }); break;
      case "middle": obj.set({ top: bounds.top + bounds.height / 2 - (obj.height ?? 0) / 2 }); break;
      case "bottom": obj.set({ top: bounds.top + bounds.height - (obj.height ?? 0) }); break;
    }
    obj.setCoords();
  });
  canvas.renderAll();
}
