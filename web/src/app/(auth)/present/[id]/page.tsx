"use client";
import { use, useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { createCanvas, loadFromJSON, SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";
import { playTransition } from "@lib/fabric/animation";
import { modelTransitionToPreview, playSlideAnimations } from "@lib/fabric/slidePlayback";
import { PresenterSocket } from "@lib/realtime/presenter";
import type { Slide } from "@shared/types/slide";

export default function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuthStore();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [cur, setCur] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const presenterRef = useRef<PresenterSocket | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    slidesApi.list(accessToken, id).then(r => setSlides(r.items as Slide[]));
    presenterRef.current = new PresenterSocket(id);
    return () => { presenterRef.current?.destroy(); };
  }, [id, accessToken]);

  useEffect(() => {
    const slide = slides[cur];
    if (!canvasRef.current || !slide) return;
    const c = createCanvas(canvasRef.current, { width: SLIDE_WIDTH / 2, height: SLIDE_HEIGHT / 2 });
    let cancelled = false;
    // Play the saved slide-level transition, then the per-element entrance
    // animations once the content is loaded. Guarded so an unmount mid-play
    // does not touch a disposed canvas.
    (async () => {
      if (stageRef.current) {
        await playTransition(stageRef.current, modelTransitionToPreview(slide.transition?.type), slide.transition?.durationMs);
      }
      await loadFromJSON(c, slide.content);
      if (!cancelled) await playSlideAnimations(c, slide.animations);
    })();
    return () => { cancelled = true; c.dispose(); };
  }, [cur, slides]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const next = useCallback(() => {
    setCur(c => {
      const newIdx = Math.min(c + 1, slides.length - 1);
      presenterRef.current?.sendSlideChange(newIdx);
      return newIdx;
    });
  }, [slides.length]);

  const prev = useCallback(() => {
    setCur(c => {
      const newIdx = Math.max(c - 1, 0);
      presenterRef.current?.sendSlideChange(newIdx);
      return newIdx;
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const currentNotes = slides[cur]?.notes;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div ref={stageRef} className="shadow-2xl rounded-lg overflow-hidden"><canvas ref={canvasRef} /></div>
        <div className="mt-4 flex items-center gap-6">
          <button onClick={prev} disabled={cur === 0} className="rounded-lg bg-gray-700 px-4 py-2 text-sm disabled:opacity-40">← 前へ</button>
          <span className="text-sm text-gray-400">{cur + 1} / {slides.length}</span>
          <button onClick={next} disabled={cur >= slides.length - 1} className="rounded-lg bg-gray-700 px-4 py-2 text-sm disabled:opacity-40">次へ →</button>
        </div>
      </div>
      <aside className="w-64 border-l border-gray-700 flex flex-col p-4 gap-4">
        <div className="rounded-xl bg-gray-800 p-4 text-center">
          <p className="text-xs text-gray-400">経過時間</p>
          <p className="text-3xl font-mono font-bold text-green-400">{fmt(elapsed)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2">スライド {cur + 1} のノート</p>
          <div className="rounded-xl bg-gray-800 p-3 text-sm text-gray-300 min-h-24 whitespace-pre-wrap">
            {currentNotes || "ノートはありません"}
          </div>
        </div>
      </aside>
    </div>
  );
}
