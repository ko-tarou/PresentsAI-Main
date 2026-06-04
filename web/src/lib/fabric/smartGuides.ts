import { Canvas, FabricObject, Line } from "fabric";

const THRESHOLD = 6; // px in canvas coords
const GUIDE_COLOR = "#F43F5E"; // PowerPoint-like red/pink

/**
 * Enable PowerPoint-style smart alignment guides while dragging objects.
 *
 * When a dragged object's left/center/right edge (or top/center/bottom edge)
 * aligns within THRESHOLD px of another object's corresponding edge — or the
 * slide center — the object snaps to that position and a dashed guide line is
 * drawn. Guides are transient (cleared on mouse:up / object:modified) and are
 * excluded from serialization/export so they never leak into saved slide JSON.
 *
 * Editor-only: do NOT call this on read-only presenter/viewer canvases.
 */
export function enableSmartGuides(canvas: Canvas) {
  let guides: Line[] = [];
  const clear = () => {
    guides.forEach((g) => canvas.remove(g));
    guides = [];
  };

  canvas.on("object:moving", (e) => {
    const obj = e.target as FabricObject;
    if (!obj) return;
    clear();
    const others = canvas
      .getObjects()
      .filter(
        (o) =>
          o !== obj &&
          !(o as FabricObject & { _isGrid?: boolean })._isGrid &&
          !(o as FabricObject & { _isGuide?: boolean })._isGuide
      );
    const ob = obj.getBoundingRect();
    const cw = canvas.getWidth() / (canvas.getZoom() || 1);
    const ch = canvas.getHeight() / (canvas.getZoom() || 1);

    // candidate vertical lines (x positions): each other obj left/center/right + slide center
    const vTargets: number[] = [cw / 2];
    const hTargets: number[] = [ch / 2];
    others.forEach((o) => {
      const b = o.getBoundingRect();
      vTargets.push(b.left, b.left + b.width / 2, b.left + b.width);
      hTargets.push(b.top, b.top + b.height / 2, b.top + b.height);
    });

    const objCenters = { l: ob.left, cx: ob.left + ob.width / 2, r: ob.left + ob.width };
    const objMid = { t: ob.top, cy: ob.top + ob.height / 2, b: ob.top + ob.height };

    const addV = (x: number) => {
      const ln = new Line([x, 0, x, ch], {
        stroke: GUIDE_COLOR,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        strokeDashArray: [4, 4],
        excludeFromExport: true,
      });
      (ln as Line & { _isGuide: boolean })._isGuide = true;
      guides.push(ln);
      canvas.add(ln);
    };
    const addH = (y: number) => {
      const ln = new Line([0, y, cw, y], {
        stroke: GUIDE_COLOR,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        strokeDashArray: [4, 4],
        excludeFromExport: true,
      });
      (ln as Line & { _isGuide: boolean })._isGuide = true;
      guides.push(ln);
      canvas.add(ln);
    };

    // snap object's left/center/right to nearest vTarget
    for (const val of Object.values(objCenters)) {
      for (const t of vTargets) {
        if (Math.abs(val - t) <= THRESHOLD) {
          const dx = t - val;
          obj.set("left", (obj.left ?? 0) + dx);
          obj.setCoords();
          addV(t);
          break;
        }
      }
    }
    for (const val of Object.values(objMid)) {
      for (const t of hTargets) {
        if (Math.abs(val - t) <= THRESHOLD) {
          const dy = t - val;
          obj.set("top", (obj.top ?? 0) + dy);
          obj.setCoords();
          addH(t);
          break;
        }
      }
    }
    guides.forEach((g) => canvas.bringObjectToFront(g));
  });

  canvas.on("mouse:up", clear);
  canvas.on("object:modified", clear);
}
