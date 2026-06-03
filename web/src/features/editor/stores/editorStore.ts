import { create } from "zustand";
import type { Canvas } from "fabric";
import type { EditorTool } from "@shared/types/slide";

interface EditorState {
  canvas: Canvas | null;
  activeTool: EditorTool;
  activeSlideId: string | null;
  presentationId: string | null;
  isDirty: boolean;
  zoom: number;

  setCanvas: (canvas: Canvas | null) => void;
  setActiveTool: (tool: EditorTool) => void;
  setActiveSlide: (slideId: string) => void;
  setPresentationId: (id: string) => void;
  setDirty: (dirty: boolean) => void;
  setZoom: (zoom: number) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  canvas: null,
  activeTool: "select",
  activeSlideId: null,
  presentationId: null,
  isDirty: false,
  zoom: 1,

  setCanvas: (canvas) => set({ canvas }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setActiveSlide: (activeSlideId) => set({ activeSlideId }),
  setPresentationId: (presentationId) => set({ presentationId }),
  setDirty: (isDirty) => set({ isDirty }),
  setZoom: (zoom) => set({ zoom }),
}));
