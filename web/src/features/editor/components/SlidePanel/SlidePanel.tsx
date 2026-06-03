"use client";
import { useSlideStore } from "../../stores/slideStore";
import { useEditorStore } from "../../stores/editorStore";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

export function SlidePanel() {
  const { slides, currentIndex, setCurrentIndex } = useSlideStore();
  const { setActiveSlide } = useEditorStore();

  function handleSelect(index: number) {
    setCurrentIndex(index);
    setActiveSlide(slides[index].id);
  }

  return (
    <aside className="flex w-44 flex-col border-r bg-gray-50 overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500">
        <span>スライド ({slides.length})</span>
      </div>
      <div className="flex-1 space-y-2 p-2">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => handleSelect(i)}
            className={`relative w-full rounded-lg border-2 transition ${
              i === currentIndex ? "border-blue-500" : "border-transparent hover:border-gray-300"
            }`}
          >
            <div
              className="w-full rounded bg-white"
              style={{ aspectRatio: `${SLIDE_WIDTH}/${SLIDE_HEIGHT}` }}
            />
            <span className="absolute bottom-1 left-1 text-xs text-gray-400">{i + 1}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
