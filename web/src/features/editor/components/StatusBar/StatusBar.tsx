"use client";
import { Minus, Plus, Maximize, Layout, Grid2x2, BookOpen, Play, FileText } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { fitToContainer, SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

export function StatusBar() {
  const { canvas, zoom, setZoom, presentationId, notesVisible, toggleNotes, viewMode, setViewMode } = useEditorStore();
  const { slides, currentIndex } = useSlideStore();

  function startSlideshow() {
    if (presentationId) window.location.href = `/present/${presentationId}`;
  }

  function openReadingView() {
    if (presentationId) window.location.href = `/view/${presentationId}`;
  }

  function applyZoom(z: number) {
    if (!canvas) return;
    const nz = Math.max(0.1, Math.min(3, z));
    canvas.setZoom(nz);
    canvas.setWidth(SLIDE_WIDTH * nz);
    canvas.setHeight(SLIDE_HEIGHT * nz);
    canvas.renderAll();
    setZoom(nz);
  }
  function fit() {
    if (!canvas) return;
    const el = canvas.wrapperEl?.parentElement;
    if (el) setZoom(fitToContainer(canvas, el.clientWidth));
  }

  return (
    <div className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-surface px-3 text-xs text-content-secondary">
      <div className="flex items-center gap-3">
        <span>スライド {slides.length === 0 ? 0 : currentIndex + 1} / {slides.length}</span>
        <button
          onClick={toggleNotes}
          title="ノート"
          aria-label="ノート"
          aria-pressed={notesVisible}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
            notesVisible ? "bg-primary-100 text-primary-700" : "hover:bg-surface-muted"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          ノート
        </button>
      </div>
      <div className="flex items-center gap-3">
        {/* View-mode buttons (PowerPoint bottom-right) */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setViewMode("normal")}
            title="標準"
            aria-label="標準"
            aria-pressed={viewMode === "normal"}
            className={`rounded p-0.5 ${viewMode === "normal" ? "bg-primary-100 text-primary-700" : "hover:bg-surface-muted"}`}
          >
            <Layout className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("sorter")}
            title="スライド一覧"
            aria-label="スライド一覧"
            aria-pressed={viewMode === "sorter"}
            className={`rounded p-0.5 ${viewMode === "sorter" ? "bg-primary-100 text-primary-700" : "hover:bg-surface-muted"}`}
          >
            <Grid2x2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={openReadingView} title="閲覧表示" aria-label="閲覧表示" className="rounded p-0.5 hover:bg-surface-muted hover:text-primary-600">
            <BookOpen className="h-3.5 w-3.5" />
          </button>
          <button onClick={startSlideshow} title="スライドショー" aria-label="スライドショー" className="rounded p-0.5 hover:bg-surface-muted hover:text-primary-600">
            <Play className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="h-4 w-px bg-border" />
        <input
          type="range" min={10} max={300} value={Math.round(zoom * 100)}
          onChange={e => applyZoom(Number(e.target.value) / 100)}
          className="h-1 w-32 cursor-pointer accent-primary-600"
          aria-label="ズーム"
        />
        <button onClick={() => applyZoom(zoom - 0.1)} className="rounded p-0.5 hover:bg-surface-muted" aria-label="縮小"><Minus className="h-3.5 w-3.5" /></button>
        <span className="w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
        <button onClick={() => applyZoom(zoom + 0.1)} className="rounded p-0.5 hover:bg-surface-muted" aria-label="拡大"><Plus className="h-3.5 w-3.5" /></button>
        <button onClick={fit} className="rounded p-0.5 hover:bg-surface-muted" title="ウィンドウに合わせる"><Maximize className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
