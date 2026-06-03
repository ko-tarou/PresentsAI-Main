"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useSlideStore } from "../../stores/slideStore";
import { useEditorStore } from "../../stores/editorStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";
import type { Slide } from "@shared/types/slide";

export function SlidePanel() {
  const { slides, currentIndex, setCurrentIndex, addSlide, deleteSlide } = useSlideStore();
  const { setActiveSlide, presentationId } = useEditorStore();
  const { accessToken } = useAuthStore();
  const [adding, setAdding] = useState(false);

  function handleSelect(i: number) {
    setCurrentIndex(i);
    setActiveSlide(slides[i].id);
  }

  async function handleAdd() {
    if (!accessToken || !presentationId || adding) return;
    setAdding(true);
    try {
      const s = await slidesApi.create(accessToken, presentationId);
      addSlide(s as Slide);
      handleSelect(slides.length);
    } finally { setAdding(false); }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (slides.length <= 1 || !accessToken || !presentationId) return;
    await slidesApi.delete(accessToken, presentationId, id);
    deleteSlide(id);
  }

  return (
    <aside className="flex w-48 flex-col border-r border-border bg-surface-subtle shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold text-content-secondary uppercase tracking-wide">
          スライド
        </span>
        <span className="text-xs text-content-tertiary">{slides.length}</span>
      </div>

      {/* Slide list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {slides.map((slide, i) => (
          <div key={slide.id} className="group relative">
            <button
              onClick={() => handleSelect(i)}
              className={`relative w-full overflow-hidden rounded-lg border-2 transition-all ${
                i === currentIndex
                  ? "border-primary-500 shadow-sm"
                  : "border-transparent hover:border-border"
              }`}
            >
              <div
                className="w-full bg-white"
                style={{ aspectRatio: `${SLIDE_WIDTH}/${SLIDE_HEIGHT}` }}
              >
                {slide.thumbnailUrl && (
                  <img src={slide.thumbnailUrl} alt={`スライド ${i+1}`} className="h-full w-full object-cover" />
                )}
              </div>
              <span className={`absolute bottom-1 left-1.5 text-xs font-medium ${
                i === currentIndex ? "text-primary-600" : "text-content-tertiary"
              }`}>
                {i + 1}
              </span>
            </button>

            {/* Delete button */}
            {slides.length > 1 && (
              <button
                onClick={(e) => handleDelete(slide.id, e)}
                className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded bg-white/90 text-content-tertiary shadow-sm hover:bg-error-light hover:text-error group-hover:flex"
                aria-label="スライドを削除"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add slide */}
      <div className="border-t border-border p-2">
        <button
          onClick={handleAdd}
          disabled={adding}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-content-tertiary transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          スライドを追加
        </button>
      </div>
    </aside>
  );
}
