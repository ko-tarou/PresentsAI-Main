"use client";
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

  function handleSelect(i: number) {
    setCurrentIndex(i);
    setActiveSlide(slides[i].id);
  }

  async function handleAdd() {
    if (!accessToken || !presentationId) return;
    const s = await slidesApi.create(accessToken, presentationId);
    addSlide(s as Slide);
    handleSelect(slides.length);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (slides.length <= 1) return;
    if (!accessToken || !presentationId) return;
    await slidesApi.delete(accessToken, presentationId, id);
    deleteSlide(id);
  }

  return (
    <aside className="flex w-44 flex-col border-r bg-gray-50 overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500">
        <span>スライド ({slides.length})</span>
      </div>
      <div className="flex-1 space-y-2 p-2">
        {slides.map((slide, i) => (
          <div key={slide.id} className="group relative">
            <button
              onClick={() => handleSelect(i)}
              className={`relative w-full rounded-lg border-2 transition ${
                i === currentIndex ? "border-blue-500" : "border-transparent hover:border-gray-300"
              }`}
            >
              <div className="w-full rounded bg-white" style={{ aspectRatio: `${SLIDE_WIDTH}/${SLIDE_HEIGHT}` }} />
              <span className="absolute bottom-1 left-1 text-xs text-gray-400">{i + 1}</span>
            </button>
            <button
              onClick={(e) => handleDelete(slide.id, e)}
              className="absolute right-1 top-1 hidden rounded bg-white p-0.5 text-xs text-gray-400 hover:text-red-500 group-hover:block shadow"
            >✕</button>
          </div>
        ))}
      </div>
      <div className="p-2 border-t">
        <button onClick={handleAdd}
          className="w-full rounded-lg border border-dashed py-2 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500">
          + スライドを追加
        </button>
      </div>
    </aside>
  );
}
