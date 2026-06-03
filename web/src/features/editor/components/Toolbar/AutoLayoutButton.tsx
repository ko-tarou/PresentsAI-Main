"use client";
import { AlignHorizontalSpaceAround, AlignVerticalSpaceAround, AlignHorizontalDistributeCenter } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { applyAutoLayout, distributeObjects } from "@lib/fabric/tools/autoLayout";

export function AutoLayoutButton() {
  const { canvas } = useEditorStore();
  return (
    <div className="flex items-center gap-1 border-l border-border pl-2">
      <button
        onClick={() => canvas && applyAutoLayout(canvas, { direction: "horizontal", gap: 12, padding: 0, align: "center" })}
        title="水平等間隔配置"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
        <AlignHorizontalSpaceAround className="h-4 w-4" />
      </button>
      <button
        onClick={() => canvas && applyAutoLayout(canvas, { direction: "vertical", gap: 12, padding: 0, align: "center" })}
        title="垂直等間隔配置"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
        <AlignVerticalSpaceAround className="h-4 w-4" />
      </button>
      <button
        onClick={() => canvas && distributeObjects(canvas, "horizontal")}
        title="水平均等分布"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
        <AlignHorizontalDistributeCenter className="h-4 w-4" />
      </button>
    </div>
  );
}
