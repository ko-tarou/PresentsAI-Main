"use client";
import { useEffect, useRef, useCallback } from "react";
import { Canvas } from "fabric";
import { createCanvas, loadFromJSON, toJSON, fitToContainer } from "@lib/fabric/canvas";
import { enableSmartGuides } from "@lib/fabric/smartGuides";
import { enablePowerPointInteractions } from "@lib/fabric/powerpointControls";
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
  const loadingRef = useRef(false); // suppress change events during programmatic load
  const lastLoadedRef = useRef<string | null>(null);
  const { setCanvas, setDirty, setZoom, activeSlideId } = useEditorStore();
  const { updateSlide } = useSlideStore();

  const updateThumbnail = useCallback(async (canvas: Canvas, slideId: string) => {
    try {
      const { generateThumbnail, uploadThumbnailDataURL } = await import("@lib/fabric/thumbnail");
      const dataURL = generateThumbnail(canvas);
      const url = await uploadThumbnailDataURL(dataURL, slideId);
      if (url) {
        useSlideStore.getState().updateSlide(slideId, { thumbnailUrl: url });
      }
    } catch { /* ignore thumbnail errors */ }
  }, []);

  const saveToServer = useCallback(async (canvas: Canvas, slideId: string, presId: string, token: string) => {
    try {
      const content = toJSON(canvas) as unknown as SlideContent;
      await slidesApi.updateContent(token, presId, slideId, content);
      setDirty(false);
      void updateThumbnail(canvas, slideId);
    } catch { /* ignore network errors during auto-save */ }
  }, [setDirty, updateThumbnail]);

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

  // Programmatically load a slide's content while suppressing change events,
  // so loadFromJSON's object:added events do not re-enter onChanged/updateSlide.
  const loadSlide = useCallback((canvas: Canvas, slideId: string) => {
    const slide = useSlideStore.getState().slides.find((s) => s.id === slideId);
    if (!slide?.content) return;
    lastLoadedRef.current = slideId;
    loadingRef.current = true;
    loadFromJSON(canvas, slide.content as unknown as Record<string, unknown>)
      .then(() => {
        canvas.renderAll();
        loadingRef.current = false;
      })
      .catch(() => {
        loadingRef.current = false;
      });
  }, []);

  const initCanvas = useCallback((el: HTMLCanvasElement) => {
    if (fabricRef.current) fabricRef.current.dispose();
    const canvas = createCanvas(el);
    fabricRef.current = canvas;
    setCanvas(canvas);

    // PowerPoint-style alignment guides while dragging (editor-only).
    enableSmartGuides(canvas);

    // PowerPoint-style interactions: 15° rotation snap + double-click shape text.
    enablePowerPointInteractions(canvas);

    const onChanged = () => {
      // Ignore events fired by a programmatic loadFromJSON; otherwise the load
      // would mutate `slides` and re-trigger itself = infinite loop.
      if (loadingRef.current) return;
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

    // Initial load of the active slide once the canvas exists. The load effect
    // below only fires on activeSlideId changes, so it may have already run
    // (with fabricRef.current === null) before this ref callback. Load here.
    const { activeSlideId: sid } = useEditorStore.getState();
    if (sid) loadSlide(canvas, sid);
  }, [setCanvas, setDirty, setZoom, updateSlide, containerRef, scheduleAutoSave, loadSlide]);

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

  // Load slide content ONLY when the active slide changes (not on content edits).
  // Reads content via getState() so the effect does not depend on `slides`.
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !activeSlideId) return;
    if (lastLoadedRef.current === activeSlideId) return; // already loaded this slide
    loadSlide(canvas, activeSlideId);
  }, [activeSlideId, loadSlide]);

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  return { canvasRef, fabricRef, initCanvas, zoom: useEditorStore.getState().zoom };
}
