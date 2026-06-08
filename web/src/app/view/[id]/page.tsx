"use client";
import { use, useEffect, useRef, useState, useCallback } from "react";
import { createCanvas, loadFromJSON, fitToContainer } from "@lib/fabric/canvas";
import { playTransition } from "@lib/fabric/animation";
import { modelTransitionToPreview, playSlideAnimations } from "@lib/fabric/slidePlayback";
import { ViewerSocket, type ViewerStatus } from "@lib/realtime/presenter";
import type { Slide } from "@shared/types/slide";

const STATUS_LABEL: Record<ViewerStatus, string> = {
  connecting: "接続中…",
  connected: "発表者に同期中",
  disconnected: "切断 — 再接続中（手動操作可）",
  // Viewers are never rejected (the public audience path accepts anonymous
  // connections); this branch exists only to satisfy the exhaustive Record.
  rejected: "接続を拒否されました",
};

export default function ViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [cur, setCur] = useState(0);
  const [status, setStatus] = useState<ViewerStatus>("connecting");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`/api/presentations/${id}/slides`).then(r=>r.json()).then((d:{items:Slide[]})=>setSlides(d.items??[]));
  }, [id]);

  // Follow the presenter: a slide-change from realtime(:8082) drives `cur`,
  // which re-runs the playback effect below (same transition/animations as
  // present). Handlers are detached on unmount so a presenter switch / route
  // change cannot push state into a gone component.
  useEffect(() => {
    let mounted = true;
    const sock = new ViewerSocket(id, {
      onSlideChange: (index) => { if (mounted) setCur(index); },
      onStatus: (s) => { if (mounted) setStatus(s); },
    });
    return () => { mounted = false; sock.destroy(); };
  }, [id]);

  useEffect(() => {
    const slide = slides[cur];
    if (!canvasRef.current||!slide||!containerRef.current) return;
    const c = createCanvas(canvasRef.current);
    fitToContainer(c, containerRef.current.clientWidth);
    let cancelled = false;
    // Same playback the presenter sees: slide-level transition first, then the
    // per-element entrance animations once the content is loaded.
    (async () => {
      const stage = c.wrapperEl;
      if (stage) await playTransition(stage, modelTransitionToPreview(slide.transition?.type), slide.transition?.durationMs);
      await loadFromJSON(c, slide.content);
      if (!cancelled) await playSlideAnimations(c, slide.animations);
    })();
    return () => { cancelled = true; c.dispose(); };
  }, [cur, slides]);

  const next = useCallback(() => setCur(c=>Math.min(c+1,slides.length-1)), [slides.length]);
  const prev = useCallback(() => setCur(c=>Math.max(c-1,0)), []);

  // Manual navigation stays available as a fallback when disconnected.
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key==="ArrowRight"||e.key===" ") next(); if (e.key==="ArrowLeft") prev(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  const dot = status === "connected" ? "bg-green-400" : status === "connecting" ? "bg-yellow-400" : "bg-red-400";

  return (
    <div ref={containerRef} className="flex h-screen flex-col items-center justify-center bg-black gap-4">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        <span>{STATUS_LABEL[status]}</span>
      </div>
      <canvas ref={canvasRef} className="shadow-2xl rounded"/>
      <div className="flex items-center gap-4">
        <button onClick={prev} disabled={cur===0} className="rounded bg-gray-800 px-4 py-2 text-white text-sm disabled:opacity-30">← 前</button>
        <span className="text-gray-400 text-sm">{cur+1} / {slides.length}</span>
        <button onClick={next} disabled={cur>=slides.length-1} className="rounded bg-gray-800 px-4 py-2 text-white text-sm disabled:opacity-30">次 →</button>
      </div>
    </div>
  );
}
