"use client";
import { useEffect, useRef, useCallback } from "react";
import { Canvas } from "fabric";
import { createCanvas, loadFromJSON, toJSON, fitToContainer } from "@lib/fabric/canvas";
import { useEditorStore } from "../stores/editorStore";
import { useSlideStore } from "../stores/slideStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import type { SlideContent } from "@shared/types/slide";

const AUTOSAVE_DELAY = 2000; // 2 seconds debounce

export function useCanvas(containerRef: React.RefObject<HTMLDivElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setCanvas, setDirty, setZoom, activeSlideId, presentationId } = useEditorStore();
  const { slides, updateSlide } = useSlideStore();
  const { accessToken } = useAuthStore();

  const saveToServer = useCallback(async (canvas: Canvas, slideId: string, presId: string, token: string) => {
    try {
      const content = toJSON(canvas) as unknown as SlideContent;
      await slidesApi.updateContent(token, presId, slideId, content);
      setDirty(false);
    } catch { /* ignore network errors during auto-save */ }
  }, [setDirty]);

  const scheduleAutoSave = useCallback((canvas: Canvas) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      const { activeSlideId: sid, presentationId: pid } = useEditorStore.getState();
      const { accessToken: tok } = useAuthStore.getState();
      if (sid && pid && tok) {
        saveToServer(canvas, sid, pid, tok);
      }
    }, AUTOSAVE_DELAY);
  }, [saveToServer]);

  const initCanvas = useCallback((el: HTMLCanvasElement) => {
    if (fabricRef.current) fabricRef.current.dispose();
    const canvas = createCanvas(el);
    fabricRef.current = canvas;
    setCanvas(canvas);

    const onChanged = () => {
      setDirty(true);
      const { activeSlideId: sid } = useEditorStore.getState();
      if (sid) updateSlide(sid, toJSON(canvas));
      scheduleAutoSave(canvas);
    };

    canvas.on("object:modified", onChanged);
    canvas.on("object:added", onChanged);
    canvas.on("object:removed", onChanged);

    // Fit to container
    if (containerRef.current) {
      const scale = fitToContainer(canvas, containerRef.current.clientWidth);
      setZoom(scale);
    }
  }, [setCanvas, setDirty, setZoom, updateSlide, containerRef, scheduleAutoSave]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current || !fabricRef.current) return;
    const ro = new ResizeObserver(() => {
      if (containerRef.current && fabricRef.current) {
        const scale = fitToContainer(fabricRef.current, containerRef.current.clientWidth);
        setZoom(scale);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [containerRef, setZoom]);

  // Load slide content when active slide changes
  useEffect(() => {
    if (!fabricRef.current || !activeSlideId) return;
    const slide = slides.find((s) => s.id === activeSlideId);
    if (slide?.content) {
      loadFromJSON(fabricRef.current, slide.content as unknown as Record<string, unknown>).then(() => {
        fabricRef.current?.renderAll();
      });
    }
  }, [activeSlideId, slides]);

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  return { canvasRef, fabricRef, initCanvas, zoom: useEditorStore.getState().zoom };
}
