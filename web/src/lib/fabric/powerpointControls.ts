import {
  Canvas,
  FabricObject,
  FabricImage,
  IText,
  InteractiveFabricObject,
  Textbox,
} from "fabric";

/**
 * Configure Fabric v6 global defaults so object selection / resize behaves like
 * Microsoft PowerPoint:
 *  - Selection handles are small white circles with a thin accent-colored border.
 *  - The shape's stroke/outline width stays constant while scaling (strokeUniform).
 *  - A rotation handle is rendered above the top-center (Fabric's default `mtr`).
 *
 * Safe to call multiple times; it is idempotent because it only assigns defaults.
 */
export function applyPowerPointControls() {
  InteractiveFabricObject.ownDefaults = {
    ...InteractiveFabricObject.ownDefaults,
    cornerStyle: "circle",
    cornerColor: "#ffffff",
    cornerStrokeColor: "#A6A6A6",
    cornerSize: 10,
    transparentCorners: false,
    borderColor: "#A6A6A6",
    borderScaleFactor: 1.5,
    padding: 0,
  };

  FabricObject.ownDefaults = {
    ...FabricObject.ownDefaults,
    // Keep stroke/outline width constant while scaling (PowerPoint behavior).
    strokeUniform: true,
    // PowerPoint never mirrors an object when you drag a corner past the
    // opposite edge; it clamps instead. Prevent negative-flip on resize.
    lockScalingFlip: true,
  };
}

/**
 * Make a Textbox reflow (wrap) text instead of distorting glyphs when scaled,
 * matching PowerPoint text-box behavior:
 *  - Scaling converts scaleX into width and resets scaleX/scaleY back to 1.
 *  - fontSize is never touched, so glyphs keep their shape.
 *  - The top/bottom mid handles are hidden (vertical stretch would distort text).
 */
export function configureTextboxNoDistort(tb: Textbox) {
  tb.setControlsVisibility({ mt: false, mb: false });
  // Guard against double-attaching the scaling handler (idempotent). This lets
  // us safely re-apply controls to textboxes restored via loadFromJSON.
  if ((tb as Textbox & { __ppNoDistort?: boolean }).__ppNoDistort) return;
  (tb as Textbox & { __ppNoDistort?: boolean }).__ppNoDistort = true;
  tb.on("scaling", () => {
    const w = tb.width * (tb.scaleX ?? 1);
    tb.set({ width: Math.max(20, w), scaleX: 1, scaleY: 1 });
  });
}

/**
 * Re-apply PowerPoint object behaviors to every object currently on the canvas.
 * Call this after loadFromJSON so objects restored from saved slide JSON keep
 * the same controls as freshly created ones:
 *  - shapes keep a constant stroke width while scaling (strokeUniform)
 *  - textboxes reflow instead of distorting glyphs when resized
 *
 * Idempotent: configureTextboxNoDistort guards against double-attaching its
 * scaling handler, so repeated calls are safe.
 */
export function applyControlsToCanvas(canvas: Canvas) {
  canvas.getObjects().forEach((o) => {
    (o as FabricObject).set?.("strokeUniform", true);
    if (o instanceof Textbox) configureTextboxNoDistort(o);
  });
}

/**
 * Wire canvas-level interaction events to mirror PowerPoint behavior:
 *
 *  - Rotation snaps to the nearest 15° when within ~7° of a multiple of 15°,
 *    matching the snap PowerPoint shows while rotating. Holding Shift forces
 *    exact 15° steps regardless of proximity.
 *  - Double-clicking a non-text, non-image shape spawns a centered editable
 *    IText so shapes can "hold text" the way PowerPoint shapes do. If the
 *    double-clicked target is already an IText/Textbox/Image, we do nothing so
 *    Fabric's own text editing kicks in.
 *
 * Idempotent: a flag on the canvas guards against attaching the listeners more
 * than once (e.g. if initCanvas runs again).
 */
export function enablePowerPointInteractions(canvas: Canvas) {
  const c = canvas as Canvas & { __ppInteractions?: boolean };
  if (c.__ppInteractions) return;
  c.__ppInteractions = true;

  // Behavior 1 — rotation snaps to 15° increments.
  canvas.on("object:rotating", (e) => {
    const o = e.target;
    if (!o) return;
    const a = o.angle ?? 0;
    const snap = Math.round(a / 15) * 15;
    const shift = (e.e as MouseEvent | undefined)?.shiftKey;
    if (shift || Math.abs(a - snap) < 7) {
      o.set("angle", snap);
    }
  });

  // Behavior 3 — double-click a shape to add centered editable text inside it.
  canvas.on("mouse:dblclick", (e) => {
    const target = e.target;
    if (!target) return;
    // Let Fabric handle native editing for text objects; ignore images.
    if (target instanceof IText || target instanceof Textbox || target instanceof FabricImage) {
      return;
    }
    const center = target.getCenterPoint();
    const itext = new IText("テキスト", {
      fontSize: 24,
      fontFamily: "sans-serif",
      fill: "#000000",
      textAlign: "center",
      originX: "center",
      originY: "center",
      left: center.x,
      top: center.y,
      editable: true,
    });
    canvas.add(itext);
    canvas.setActiveObject(itext);
    itext.enterEditing();
    itext.selectAll();
    canvas.requestRenderAll();
  });
}
