"use client";
import { Monitor } from "lucide-react";
import { useSlideStore } from "../../stores/slideStore";
import { useEditorStore } from "../../stores/editorStore";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

export function SlideSorter() {
  const { slides, currentIndex, setCurrentIndex } = useSlideStore();
  const { setActiveSlide, setViewMode } = useEditorStore();

  function openSlide(i: number) {
    setCurrentIndex(i);
    setActiveSlide(slides[i].id);
    setViewMode("normal");
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
                className="group flex flex-col gap-1.5 text-left"
              >
                <div
                  className={`relative overflow-hidden rounded-lg border-2 bg-white shadow-sm transition-all aspect-video group-hover:shadow-md ${
                    i === currentIndex
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
