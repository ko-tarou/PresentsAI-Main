"use client";
import { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { BUILT_IN_TEMPLATES } from "@lib/fabric/templates";
import type { SlideContent } from "@shared/types/slide";

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
      <button onClick={()=>setOpen(!open)} className="flex h-10 items-center gap-1 rounded-lg px-3 text-sm hover:bg-blue-50" title="テンプレート">📑<span className="text-xs">テンプレ</span></button>
      {open && (
        <div className="absolute left-0 top-12 z-10 grid grid-cols-2 gap-2 rounded-xl border bg-white shadow-lg p-3 w-60">
          {BUILT_IN_TEMPLATES.map(t=>(
            <button key={t.id} onClick={()=>apply(t.content)} className="flex flex-col items-center gap-1 rounded-lg border p-3 text-xs hover:bg-blue-50 hover:border-blue-300">
              <span className="text-2xl">{t.thumbnail}</span>
              <span className="text-gray-600">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
