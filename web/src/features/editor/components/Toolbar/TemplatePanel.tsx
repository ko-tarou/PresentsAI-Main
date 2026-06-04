"use client";
import { LayoutTemplate, Square, Heading, Columns2, Moon } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { BUILT_IN_TEMPLATES } from "@lib/fabric/templates";
import { Popover } from "@shared/components/ui";
import type { SlideContent } from "@shared/types/slide";

const TEMPLATE_ICONS: Record<string, typeof Square> = {
  blank: Square,
  title: Heading,
  "two-col": Columns2,
  dark: Moon,
};

export function TemplatePanel() {
  const { canvas, activeSlideId } = useEditorStore();
  const { updateSlide } = useSlideStore();
  function apply(content: SlideContent) {
    if (!canvas||!activeSlideId) return;
    canvas.loadFromJSON(content).then(()=>{ canvas.renderAll(); updateSlide(activeSlideId, content as unknown as Record<string, unknown>); });
  }
  return (
    <Popover
      align="left"
      trigger={({ toggle, ref }) => (
        <span ref={ref as (el: HTMLSpanElement | null) => void} className="inline-flex">
          <button onClick={toggle} title="テンプレート"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
            <LayoutTemplate className="h-4 w-4" /><span className="text-xs">テンプレ</span>
          </button>
        </span>
      )}
    >
      {(close) => (
        <div className="grid w-60 grid-cols-2 gap-2 p-3">
          {BUILT_IN_TEMPLATES.map(t=>{
            const Icon = TEMPLATE_ICONS[t.id] ?? Square;
            return (
              <button key={t.id} onClick={()=>{ apply(t.content); close(); }}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs text-content-secondary hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600 transition-colors">
                <Icon className="h-6 w-6" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}
