import { create } from "zustand";
import type { Canvas } from "fabric";
import type { EditorTool } from "@shared/types/slide";

export type ViewMode = "normal" | "sorter";

interface EditorState {
  canvas: Canvas | null;
  activeTool: EditorTool;
  activeSlideId: string | null;
  presentationId: string | null;
  isDirty: boolean;
  zoom: number;
  notesVisible: boolean;
  viewMode: ViewMode;
  showRuler: boolean;
  showLayers: boolean;
  showComments: boolean;
  showVersions: boolean;

  setCanvas: (canvas: Canvas | null) => void;
  setActiveTool: (tool: EditorTool) => void;
  setActiveSlide: (slideId: string) => void;
  setPresentationId: (id: string) => void;
  setDirty: (dirty: boolean) => void;
  setZoom: (zoom: number) => void;
  toggleNotes: () => void;
  setNotesVisible: (visible: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleRuler: () => void;
  setShowRuler: (show: boolean) => void;
  toggleLayers: () => void;
  setShowLayers: (show: boolean) => void;
  toggleComments: () => void;
  setShowComments: (show: boolean) => void;
  toggleVersions: () => void;
  setShowVersions: (show: boolean) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  canvas: null,
  activeTool: "select",
  activeSlideId: null,
  presentationId: null,
  isDirty: false,
  zoom: 1,
  notesVisible: true,
  viewMode: "normal",
  showRuler: false,
  showLayers: false,
  showComments: false,
  showVersions: false,

  setCanvas: (canvas) => set({ canvas }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setActiveSlide: (activeSlideId) => set({ activeSlideId }),
  setPresentationId: (presentationId) => set({ presentationId }),
  setDirty: (isDirty) => set({ isDirty }),
  setZoom: (zoom) => set({ zoom }),
  toggleNotes: () => set((s) => ({ notesVisible: !s.notesVisible })),
  setNotesVisible: (notesVisible) => set({ notesVisible }),
  setViewMode: (viewMode) => set({ viewMode }),
  toggleRuler: () => set((s) => ({ showRuler: !s.showRuler })),
  setShowRuler: (showRuler) => set({ showRuler }),
  toggleLayers: () => set((s) => ({ showLayers: !s.showLayers })),
  setShowLayers: (showLayers) => set({ showLayers }),
  toggleComments: () => set((s) => ({ showComments: !s.showComments })),
  setShowComments: (showComments) => set({ showComments }),
  toggleVersions: () => set((s) => ({ showVersions: !s.showVersions })),
  setShowVersions: (showVersions) => set({ showVersions }),
}));
