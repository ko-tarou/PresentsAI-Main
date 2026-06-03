import { Canvas, Path, Point } from "fabric";

export class PenTool {
  private canvas: Canvas;
  private points: Point[] = [];
  private isDrawing = false;
  private previewPath: Path | null = null;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  enable() {
    this.canvas.isDrawingMode = false;
    this.canvas.selection = false;
    this.canvas.on("mouse:down", this.onMouseDown);
    this.canvas.on("mouse:move", this.onMouseMove);
    this.canvas.on("mouse:dblclick", this.onDblClick);
  }

  disable() {
    this.canvas.selection = true;
    this.canvas.off("mouse:down", this.onMouseDown);
    this.canvas.off("mouse:move", this.onMouseMove);
    this.canvas.off("mouse:dblclick", this.onDblClick);
    if (this.previewPath) { this.canvas.remove(this.previewPath); this.previewPath = null; }
    this.points = []; this.isDrawing = false;
  }

  private onMouseDown = (e: { pointer?: Point }) => {
    if (!e.pointer) return;
    this.isDrawing = true;
    this.points.push(new Point(e.pointer.x, e.pointer.y));
    this.updatePreview();
  };

  private onMouseMove = (e: { pointer?: Point }) => {
    if (!this.isDrawing || this.points.length === 0 || !e.pointer) return;
    this.updatePreview(new Point(e.pointer.x, e.pointer.y));
  };

  private onDblClick = () => {
    this.finalizePath();
  };

  private buildPathString(preview?: Point): string {
    if (this.points.length === 0) return "";
    const pts = preview ? [...this.points, preview] : this.points;
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp = i < pts.length - 1
        ? new Point((pts[i-1].x + pts[i].x) / 2, (pts[i-1].y + pts[i].y) / 2)
        : pts[i];
      d += ` Q ${pts[i-1].x} ${pts[i-1].y} ${cp.x} ${cp.y}`;
    }
    return d;
  }

  private updatePreview(cursor?: Point) {
    if (this.previewPath) this.canvas.remove(this.previewPath);
    const d = this.buildPathString(cursor);
    if (!d) return;
    this.previewPath = new Path(d, {
      stroke: "#3B5BDB", strokeWidth: 2, fill: "transparent",
      selectable: false, evented: false,
    });
    this.canvas.add(this.previewPath);
    this.canvas.renderAll();
  }

  private finalizePath() {
    if (this.previewPath) this.canvas.remove(this.previewPath);
    const d = this.buildPathString();
    if (d && this.points.length >= 2) {
      const path = new Path(d, { stroke: "#333", strokeWidth: 2, fill: "transparent" });
      this.canvas.add(path);
      this.canvas.setActiveObject(path);
    }
    this.points = []; this.isDrawing = false; this.previewPath = null;
    this.canvas.renderAll();
  }
}
