import { Canvas, Path, Circle, Point } from "fabric";

interface NodeHandle extends Circle {
  _nodeIndex: number;
  _pathRef: Path;
}

export class NodeEditor {
  private canvas: Canvas;
  private handles: NodeHandle[] = [];
  private activePath: Path | null = null;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  edit(path: Path) {
    this.clear();
    this.activePath = path;
    const pathData = path.path as unknown as Array<[string, ...number[]]>;
    if (!pathData) return;

    const pts = this.extractPoints(pathData);
    this.handles = pts.map((pt, i) => {
      const h = new Circle({
        left: (path.left ?? 0) + pt.x - 6,
        top: (path.top ?? 0) + pt.y - 6,
        radius: 6,
        fill: "#fff",
        stroke: "#3B5BDB",
        strokeWidth: 2,
        selectable: true,
        hasBorders: false,
        hasControls: false,
      }) as unknown as NodeHandle;
      h._nodeIndex = i;
      h._pathRef = path;
      this.canvas.add(h);
      h.on("moving", () => this.updatePath(h));
      return h;
    });
    this.canvas.renderAll();
  }

  clear() {
    this.handles.forEach(h => this.canvas.remove(h));
    this.handles = []; this.activePath = null;
  }

  private extractPoints(pathData: Array<[string, ...number[]]>): Point[] {
    return pathData
      .filter(cmd => cmd[0] === "M" || cmd[0] === "L" || cmd[0] === "Q" || cmd[0] === "C")
      .map(cmd => {
        const last = cmd.slice(-2) as [number, number];
        return new Point(last[0], last[1]);
      });
  }

  private updatePath(handle: NodeHandle) {
    if (!handle._pathRef) return;
    const dx = (handle.left ?? 0) - (handle._pathRef.left ?? 0) + 6;
    const dy = (handle.top ?? 0) - (handle._pathRef.top ?? 0) + 6;
    const pathData = handle._pathRef.path as unknown as Array<[string, ...number[]]>;
    if (!pathData) return;
    let ptIdx = 0;
    pathData.forEach(cmd => {
      if (cmd[0] === "M" || cmd[0] === "L") {
        if (ptIdx === handle._nodeIndex) { cmd[1] = dx; cmd[2] = dy; }
        ptIdx++;
      } else if (cmd[0] === "Q") {
        if (ptIdx === handle._nodeIndex) { cmd[3] = dx; cmd[4] = dy; }
        ptIdx++;
      }
    });
    handle._pathRef.set("path", pathData as unknown as Path["path"]);
    this.canvas.renderAll();
  }
}
