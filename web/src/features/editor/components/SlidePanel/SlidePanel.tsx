"use client";
import { useEffect, useState } from "react";
import { Plus, CopyPlus, Trash2 } from "lucide-react";
import { useSlideStore } from "../../stores/slideStore";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStructureOps } from "../../hooks/slideStructureContext";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";
import type { Slide } from "@shared/types/slide";

interface MenuState {
  x: number;
  y: number;
  slideId: string;
}

export function SlidePanel() {
  const { slides, currentIndex, setCurrentIndex, addSlide, updateSlide, deleteSlide } = useSlideStore();
  const { setActiveSlide, presentationId } = useEditorStore();
  const { accessToken } = useAuthStore();
  const structure = useSlideStructureOps();
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);

  function handleSelect(i: number) {
    setCurrentIndex(i);
    setActiveSlide(slides[i].id);
  }

  // Select a slide we just appended. We can't reuse handleSelect(slides.length)
  // here because `slides` is the render-time snapshot — addSlide updates the
  // store but this closure still sees the pre-add array, so slides[slides.length]
  // is undefined and reading `.id` throws. Select by the created id directly.
  function selectAppended(slideId: string) {
    setCurrentIndex(slides.length);
    setActiveSlide(slideId);
  }

  async function handleAdd() {
    if (!accessToken || !presentationId || adding) return;
    setAdding(true);
    try {
      const s = await slidesApi.create(accessToken, presentationId);
      addSlide(s as Slide);
      // Mirror the new slide into the shared doc so peers see it too.
      structure.addSlide((s as Slide).id);
      selectAppended((s as Slide).id);
    } finally { setAdding(false); }
  }

  async function handleDuplicate(slide: Slide) {
    if (!accessToken || !presentationId || adding) return;
    setAdding(true);
    try {
      const created = (await slidesApi.create(accessToken, presentationId)) as Slide;
      await slidesApi.updateContent(accessToken, presentationId, created.id, slide.content);
      addSlide({ ...created, content: slide.content });
      updateSlide(created.id, slide.content as unknown as Record<string, unknown>);
      // Mirror the duplicated slide into the shared doc; its objects sync via
      // the per-slide ObjectBinding / projection autosave.
      structure.addSlide(created.id);
      selectAppended(created.id);
    } finally { setAdding(false); }
  }

  async function handleDelete(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (slides.length <= 1 || !accessToken || !presentationId) return;
    await slidesApi.delete(accessToken, presentationId, id);
    deleteSlide(id);
    // Mirror the removal into the shared doc so peers drop it too.
    structure.removeSlide(id);
  }

  function openMenu(e: React.MouseEvent, slideId: string) {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, slideId });
  }

  useEffect(() => {
    if (!menu) return;
    function close() { setMenu(null); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMenu(null); }
    document.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", close);
      window.clearTimeout(id);
    };
  }, [menu]);

  const menuSlide = menu ? slides.find((s) => s.id === menu.slideId) ?? null : null;

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
          <div
            key={slide.id}
            className="group relative flex items-stretch gap-1"
            onContextMenu={(e) => openMenu(e, slide.id)}
          >
            {/* Left rail: slide number */}
            <div className="flex w-5 shrink-0 items-start justify-center pt-0.5">
              <span className={`text-xs ${
                i === currentIndex ? "text-primary-600 font-semibold" : "text-content-tertiary"
              }`}>
                {i + 1}
              </span>
            </div>

            {/* Thumbnail card */}
            <button
              onClick={() => handleSelect(i)}
              className={`relative flex-1 overflow-hidden rounded-lg border-2 transition-all ${
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

      {/* Right-click context menu */}
      {menu && menuSlide && (
        <div
          role="menu"
          className="fixed z-[100] min-w-44 rounded-xl border border-border bg-surface py-1 shadow-modal"
          style={{ left: menu.x, top: menu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            role="menuitem"
            onClick={() => { setMenu(null); handleAdd(); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-content-primary hover:bg-surface-subtle"
          >
            <Plus className="h-4 w-4" />
            新しいスライド
          </button>
          <button
            role="menuitem"
            onClick={() => { setMenu(null); handleDuplicate(menuSlide); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-content-primary hover:bg-surface-subtle"
          >
            <CopyPlus className="h-4 w-4" />
            複製
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            role="menuitem"
            disabled={slides.length <= 1}
            onClick={() => { setMenu(null); handleDelete(menuSlide.id); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-error hover:bg-surface-subtle disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Trash2 className="h-4 w-4" />
            削除
          </button>
        </div>
      )}
    </aside>
  );
}
