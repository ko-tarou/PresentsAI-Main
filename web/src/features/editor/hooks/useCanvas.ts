"use client";
import { useEffect, useRef, useCallback } from "react";
import { Canvas } from "fabric";
import { createCanvas, loadFromJSON, toJSON, fitToContainer } from "@lib/fabric/canvas";
import { useEditorStore } from "../stores/editorStore";
import { useSlideStore } from "../stores/slideStore";

export function useCanvas(containerRef: React.RefObject<HTMLDivElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const { setCanvas, setDirty, setZoom, activeSlideId } = useEditorStore();
  const { slides, updateSlide } = useSlideStore();

  // Initialize canvas
  const initCanvas = useCallback((el: HTMLCanvasElement) => {
    if (fabricRef.current) fabricRef.current.dispose();
    const canvas = createCanvas(el);
    fabricRef.current = canvas;
    setCanvas(canvas);

    canvas.on("object:modified", () => {
      setDirty(true);
      if (activeSlideId) {
        updateSlide(activeSlideId, toJSON(canvas));
      }
    });
    canvas.on("object:added", () => setDirty(true));
    canvas.on("object:removed", () => setDirty(true));

    // Fit to container
    if (containerRef.current) {
      const scale = fitToContainer(canvas, containerRef.current.clientWidth);
      setZoom(scale);
    }
  }, [setCanvas, setDirty, setZoom, activeSlideId, updateSlide, containerRef]);

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
      loadFromJSON(fabricRef.current, slide.content as unknown as Record<string, unknown>);
    }
  }, [activeSlideId, slides]);

  return { canvasRef, fabricRef, initCanvas, zoom: useEditorStore.getState().zoom };
}
