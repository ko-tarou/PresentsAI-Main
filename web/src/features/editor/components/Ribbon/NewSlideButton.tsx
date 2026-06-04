"use client";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { SLIDE_LAYOUTS, type SlideLayout } from "@lib/fabric/layouts";
import { RibbonBigButton } from "./ribbonPrimitives";
import type { Slide } from "@shared/types/slide";

const PREVIEW_W = 1280;
const PREVIEW_H = 720;

// A tiny scaled-down rendering of the layout's text objects.
function LayoutPreview({ layout }: { layout: SlideLayout }) {
  const bg = layout.content.background ?? "#ffffff";
  return (
    <div
      className="relative w-full overflow-hidden rounded border border-border"
      style={{ aspectRatio: `${PREVIEW_W}/${PREVIEW_H}`, background: bg }}
    >
      {layout.content.objects.map((obj, i) => {
        const o = obj as Record<string, unknown>;
        if (o.type !== "textbox") return null;
        const left = Number(o.left ?? 0);
        const top = Number(o.top ?? 0);
        const width = Number(o.width ?? 0);
        const fontSize = Number(o.fontSize ?? 16);
        return (
          <div
            key={i}
            className="absolute truncate"
            style={{
              left: `${(left / PREVIEW_W) * 100}%`,
              top: `${(top / PREVIEW_H) * 100}%`,
              width: `${(width / PREVIEW_W) * 100}%`,
              fontSize: `${Math.max(3, (fontSize / PREVIEW_W) * 100)}px`,
              fontWeight: o.fontWeight === "bold" ? 700 : 400,
              color: String(o.fill ?? "#000"),
              textAlign: (o.textAlign as "left" | "center" | "right") ?? "left",
              lineHeight: 1.1,
            }}
          >
            {String(o.text ?? "")}
          </div>
        );
      })}
    </div>
  );
}

export function NewSlideButton() {
  const { slides, addSlide, setCurrentIndex, updateSlide } = useSlideStore();
  const { setActiveSlide, presentationId } = useEditorStore();
  const { accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function applyLayout(layout: SlideLayout) {
    if (!accessToken || !presentationId || adding) return;
    setOpen(false);
    setAdding(true);
    try {
      const created = (await slidesApi.create(accessToken, presentationId)) as Slide;
      addSlide(created);
      // Seed the local store with the layout BEFORE switching the active slide,
      // so the canvas load effect (keyed on activeSlideId) renders the layout.
      updateSlide(created.id, layout.content as unknown as Record<string, unknown>);
      setCurrentIndex(slides.length);
      setActiveSlide(created.id);
      // Persist the layout content to the server as well.
      await slidesApi.updateContent(accessToken, presentationId, created.id, layout.content);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative h-full">
      <RibbonBigButton
        icon={<Plus />}
        label="新しいスライド"
        onClick={() => setOpen((o) => !o)}
        disabled={adding || !presentationId}
        testId="new-slide"
      />
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-border bg-surface p-3 shadow-modal">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">
            レイアウト
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SLIDE_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                data-testid={`layout-${layout.id}`}
                onClick={() => applyLayout(layout)}
                className="group flex flex-col gap-1 rounded-lg border border-transparent p-1.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <LayoutPreview layout={layout} />
                <span className="truncate px-0.5 text-[11px] text-content-secondary group-hover:text-primary-700">
                  {layout.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
