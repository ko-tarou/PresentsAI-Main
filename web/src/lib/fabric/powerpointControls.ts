import { Canvas, FabricObject, InteractiveFabricObject, Textbox } from "fabric";

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
