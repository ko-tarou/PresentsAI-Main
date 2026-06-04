"use client";
import { use, useEffect, useRef, useState, useCallback } from "react";
import { createCanvas, loadFromJSON, fitToContainer } from "@lib/fabric/canvas";
import type { Slide } from "@shared/types/slide";

export default function ViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [cur, setCur] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`/api/presentations/${id}/slides`).then(r=>r.json()).then((d:{items:Slide[]})=>setSlides(d.items??[]));
  }, [id]);

  useEffect(() => {
    if (!canvasRef.current||!slides[cur]||!containerRef.current) return;
    const c = createCanvas(canvasRef.current);
    fitToContainer(c, containerRef.current.clientWidth);
    loadFromJSON(c, slides[cur].content);
    return () => { c.dispose(); };
  }, [cur, slides]);

  const next = useCallback(() => setCur(c=>Math.min(c+1,slides.length-1)), [slides.length]);
  const prev = useCallback(() => setCur(c=>Math.max(c-1,0)), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key==="ArrowRight"||e.key===" ") next(); if (e.key==="ArrowLeft") prev(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  return (
    <div ref={containerRef} className="flex h-screen flex-col items-center justify-center bg-black gap-4">
      <canvas ref={canvasRef} className="shadow-2xl rounded"/>
      <div className="flex items-center gap-4">
        <button onClick={prev} disabled={cur===0} className="rounded bg-gray-800 px-4 py-2 text-white text-sm disabled:opacity-30">← 前</button>
        <span className="text-gray-400 text-sm">{cur+1} / {slides.length}</span>
        <button onClick={next} disabled={cur>=slides.length-1} className="rounded bg-gray-800 px-4 py-2 text-white text-sm disabled:opacity-30">次 →</button>
      </div>
    </div>
  );
}
