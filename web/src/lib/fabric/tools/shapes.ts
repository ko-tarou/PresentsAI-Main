import {
  Canvas, Rect, Circle, Triangle, Line, Polygon,
  FabricObject, Path,
} from "fabric";

export type ShapeType = "rect" | "circle" | "triangle" | "line" | "arrow" | "star" | "diamond";

interface ShapeOptions {
  left?: number;
  top?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export function addShape(canvas: Canvas, type: ShapeType, opts: ShapeOptions = {}): FabricObject {
  const base = {
    left: opts.left ?? 100,
    top: opts.top ?? 100,
    fill: opts.fill ?? "#4A90E2",
    stroke: opts.stroke ?? "transparent",
    strokeWidth: opts.strokeWidth ?? 0,
    // Keep outline width constant while scaling (PowerPoint behavior).
    strokeUniform: true,
  };

  let obj: FabricObject;

  switch (type) {
    case "rect":
      obj = new Rect({ ...base, width: 200, height: 120, rx: 4, ry: 4 });
      break;
    case "circle":
      obj = new Circle({ ...base, radius: 70 });
      break;
    case "triangle":
      obj = new Triangle({ ...base, width: 150, height: 150 });
      break;
    case "line":
      obj = new Line([0, 0, 200, 0], {
        left: base.left, top: base.top,
        stroke: opts.stroke ?? "#333333",
        strokeWidth: opts.strokeWidth ?? 2,
        fill: "transparent",
        strokeUniform: true,
      });
      break;
    case "arrow":
      obj = new Path("M 0 0 L 180 0 L 160 -15 M 180 0 L 160 15", {
        left: base.left, top: base.top,
        stroke: opts.stroke ?? "#333333",
        strokeWidth: opts.strokeWidth ?? 2,
        fill: "transparent",
        strokeUniform: true,
      });
      break;
    case "star":
      obj = new Path(starPath(5, 60, 30), {
        ...base, left: base.left + 60, top: base.top + 60,
      });
      break;
    case "diamond":
      obj = new Polygon(
        [{ x: 80, y: 0 }, { x: 160, y: 60 }, { x: 80, y: 120 }, { x: 0, y: 60 }],
        base
      );
      break;
    default:
      obj = new Rect({ ...base, width: 200, height: 120 });
  }

  canvas.add(obj);
  canvas.setActiveObject(obj);
  canvas.renderAll();
  return obj;
}

function starPath(points: number, outer: number, inner: number): string {
  let path = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    path += `${i === 0 ? "M" : "L"} ${x} ${y} `;
  }
  return path + "Z";
}
