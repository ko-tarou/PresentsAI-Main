import { Canvas, Path, FabricObject } from "fabric";

type BooleanOp = "union" | "subtract" | "intersect" | "exclude";

export function performBoolean(canvas: Canvas, op: BooleanOp): void {
  const objects = canvas.getActiveObjects();
  if (objects.length < 2) { alert("2つ以上の図形を選択してください"); return; }

  const paths = objects.map(obj => {
    const svg = obj.toSVG();
    const match = svg.match(/d="([^"]+)"/);
    return match ? match[1] : "";
  }).filter(Boolean);

  if (paths.length < 2) { alert("パス図形のみ対応しています"); return; }

  let resultPath = paths[0];
  for (let i = 1; i < paths.length; i++) {
    switch (op) {
      case "union":
        resultPath = `${resultPath} ${paths[i]}`;
        break;
      case "subtract":
        resultPath = `${resultPath} ${paths[i]}`;
        break;
      default:
        resultPath = `${resultPath} ${paths[i]}`;
    }
  }

  const firstObj = objects[0] as FabricObject & { fill?: string };
  const combined = new Path(resultPath, {
    left: objects[0].left,
    top: objects[0].top,
    fill: firstObj.fill ?? "#4A90E2",
    stroke: "transparent",
    strokeWidth: 0,
    fillRule: op === "exclude" ? "evenodd" : "nonzero",
  });

  objects.forEach(o => canvas.remove(o));
  canvas.discardActiveObject();
  canvas.add(combined);
  canvas.setActiveObject(combined);
  canvas.renderAll();
}
