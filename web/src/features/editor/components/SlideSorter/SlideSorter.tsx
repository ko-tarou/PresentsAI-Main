"use client";
import { useRef, useState } from "react";
import { Monitor } from "lucide-react";
import { useSlideStore } from "../../stores/slideStore";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStructureOps } from "../../hooks/slideStructureContext";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

export function SlideSorter() {
  const { slides, currentIndex, setCurrentIndex, setSlides } = useSlideStore();
  const { setActiveSlide, setViewMode, presentationId } = useEditorStore();
  const { accessToken } = useAuthStore();
  const structure = useSlideStructureOps();
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function openSlide(i: number) {
    setCurrentIndex(i);
    setActiveSlide(slides[i].id);
    setViewMode("normal");
  }

  // Reorder locally, mirror into the shared doc, and persist positions.
  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= slides.length) return;
    const id = slides[from].id;
    const next = [...slides];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSlides(next.map((s, i) => ({ ...s, position: i })));
    structure.moveSlide(id, to);
    if (accessToken && presentationId) {
      const positions: Record<string, number> = {};
      next.forEach((s, i) => { positions[s.id] = i; });
      void slidesApi.reorder(accessToken, presentationId, positions).catch(() => {});
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface-subtle">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-3 shrink-0">
        <h2 className="text-sm font-semibold text-content-primary">
          スライド一覧
          <span className="ml-2 text-xs font-normal text-content-tertiary">
            ({slides.length} スライド)
          </span>
        </h2>
        <button
          onClick={() => setViewMode("normal")}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-muted hover:text-content-primary"
        >
          <Monitor className="h-3.5 w-3.5" />
          標準表示に戻る
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        {slides.length === 0 ? (
          <p className="text-center text-sm text-content-tertiary">スライドがありません</p>
        ) : (
          <div className="grid grid-cols-3 gap-6 lg:grid-cols-4">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => openSlide(i)}
                onDoubleClick={() => openSlide(i)}
                draggable
                onDragStart={() => { dragFrom.current = i; }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                onDragLeave={() => setDragOver((d) => (d === i ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom.current !== null) reorder(dragFrom.current, i);
                  dragFrom.current = null;
                  setDragOver(null);
                }}
                onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                className="group flex flex-col gap-1.5 text-left"
              >
                <div
                  className={`relative overflow-hidden rounded-lg border-2 bg-white shadow-sm transition-all aspect-video group-hover:shadow-md ${
                    dragOver === i
                      ? "border-primary-500 ring-2 ring-primary-300"
                      : i === currentIndex
                      ? "border-primary-500 ring-2 ring-primary-200"
                      : "border-border group-hover:border-primary-300"
                  }`}
                  style={{ aspectRatio: `${SLIDE_WIDTH}/${SLIDE_HEIGHT}` }}
                >
                  {slide.thumbnailUrl ? (
                    <img
                      src={slide.thumbnailUrl}
                      alt={`スライド ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-light text-content-tertiary">
                      {i + 1}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs ${
                    i === currentIndex
                      ? "font-semibold text-primary-600"
                      : "text-content-tertiary"
                  }`}
                >
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
