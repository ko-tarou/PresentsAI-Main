"use client";
import { useEditorStore } from "../../stores/editorStore";
import { applyAutoLayout, distributeObjects } from "@lib/fabric/tools/autoLayout";

export function AutoLayoutButton() {
  const { canvas } = useEditorStore();
  return (
    <div className="flex items-center gap-1 border-l pl-2">
      <button
        onClick={() => canvas && applyAutoLayout(canvas, { direction: "horizontal", gap: 12, padding: 0, align: "center" })}
        title="水平等間隔配置"
        className="rounded px-2 py-1.5 text-xs hover:bg-gray-100">
        ⇔
      </button>
      <button
        onClick={() => canvas && applyAutoLayout(canvas, { direction: "vertical", gap: 12, padding: 0, align: "center" })}
        title="垂直等間隔配置"
        className="rounded px-2 py-1.5 text-xs hover:bg-gray-100">
        ⇕
      </button>
      <button
        onClick={() => canvas && distributeObjects(canvas, "horizontal")}
        title="水平均等分布"
        className="rounded px-2 py-1.5 text-xs hover:bg-gray-100">
        ||
      </button>
    </div>
  );
}
