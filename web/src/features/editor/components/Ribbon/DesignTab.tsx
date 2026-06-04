"use client";
import { Monitor, Square } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { BUILT_IN_TEMPLATES } from "@lib/fabric/templates";
import type { SlideContent } from "@shared/types/slide";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

export function DesignTab() {
  const { canvas, activeSlideId } = useEditorStore();
  const { updateSlide } = useSlideStore();

  function applyTemplate(content: SlideContent) {
    if (!canvas || !activeSlideId) return;
    canvas.loadFromJSON(content).then(() => {
      canvas.renderAll();
      updateSlide(activeSlideId, content as unknown as Record<string, unknown>);
    });
  }

  function setBackground(color: string) {
    if (!canvas) return;
    canvas.backgroundColor = color;
    canvas.renderAll();
  }

  return (
    <div className="flex h-full items-stretch">
      {/* Theme gallery */}
      <RibbonGroup label="テーマ">
        <div className="flex items-center gap-1.5">
          {BUILT_IN_TEMPLATES.map((t) => {
            const swatch = (t.content.background as string) ?? "#ffffff";
            return (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.content)}
                disabled={!canvas}
                title={`テーマ: ${t.name}`}
                className="flex w-16 flex-col items-center gap-1 rounded-md border border-border p-1 text-content-secondary hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <span
                  className="h-7 w-full rounded border border-border/60"
                  style={{ backgroundColor: swatch }}
                />
                <span className="text-[10px] leading-none truncate w-full text-center">{t.name}</span>
              </button>
            );
          })}
        </div>
      </RibbonGroup>
      <RibbonDivider />

      {/* User settings: slide size + background */}
      <RibbonGroup label="ユーザー設定">
        <RibbonBigButton
          icon={<Monitor />}
          label="スライドのサイズ"
          title="スライドのサイズ (16:9) — 次のアップデートで切り替え対応"
        />
        <label
          title="背景の書式設定"
          className="flex h-full min-w-14 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors cursor-pointer"
        >
          <Square className="h-5 w-5" />
          <span className="text-[11px] leading-tight text-center max-w-16">背景</span>
          <input
            type="color"
            className="sr-only"
            onChange={(e) => setBackground(e.target.value)}
            disabled={!canvas}
          />
        </label>
      </RibbonGroup>
    </div>
  );
}
