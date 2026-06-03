"use client";
import { useState } from "react";
import { LayoutTemplate, Square, Heading, Columns2, Moon } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { BUILT_IN_TEMPLATES } from "@lib/fabric/templates";
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
  const [open, setOpen] = useState(false);
  function apply(content: SlideContent) {
    if (!canvas||!activeSlideId) return;
    canvas.loadFromJSON(content).then(()=>{ canvas.renderAll(); updateSlide(activeSlideId, content as Record<string, unknown>); });
    setOpen(false);
  }
  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)} title="テンプレート"
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors">
        <LayoutTemplate className="h-4 w-4" /><span className="text-xs">テンプレ</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-20 grid w-60 grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-3 shadow-modal">
            {BUILT_IN_TEMPLATES.map(t=>{
              const Icon = TEMPLATE_ICONS[t.id] ?? Square;
              return (
                <button key={t.id} onClick={()=>apply(t.content)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs text-content-secondary hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600 transition-colors">
                  <Icon className="h-6 w-6" />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
