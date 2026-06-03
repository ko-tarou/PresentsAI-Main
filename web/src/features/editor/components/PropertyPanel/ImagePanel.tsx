"use client";
import { useEditorStore } from "../../stores/editorStore";
import { applyBrightness, applyGrayscale, applyBlur, resetFilters } from "@lib/fabric/tools/imageEffects";
import { FabricImage } from "fabric";

export function ImagePanel() {
  const { canvas } = useEditorStore();
  const obj = canvas?.getActiveObject();
  if (!(obj instanceof FabricImage)) return null;

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs font-medium text-gray-500">画像エフェクト</p>
      <label className="block text-xs text-gray-500">明度
        <input type="range" min="-1" max="1" step="0.1" defaultValue="0"
          onChange={e => canvas && applyBrightness(canvas, Number(e.target.value))}
          className="w-full mt-1" />
      </label>
      <label className="block text-xs text-gray-500">ぼかし
        <input type="range" min="0" max="1" step="0.05" defaultValue="0"
          onChange={e => canvas && applyBlur(canvas, Number(e.target.value))}
          className="w-full mt-1" />
      </label>
      <div className="flex gap-2">
        <button onClick={() => canvas && applyGrayscale(canvas)}
          className="flex-1 rounded bg-gray-100 py-1.5 text-xs hover:bg-gray-200">
          グレースケール
        </button>
        <button onClick={() => canvas && resetFilters(canvas)}
          className="flex-1 rounded border py-1.5 text-xs hover:bg-gray-50">
          リセット
        </button>
      </div>
    </div>
  );
}
