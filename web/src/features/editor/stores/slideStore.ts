import { create } from "zustand";
import type { Slide } from "@shared/types/slide";

interface SlideState {
  slides: Slide[];
  currentIndex: number;

  setSlides: (slides: Slide[]) => void;
  addSlide: (slide: Slide) => void;
  updateSlide: (id: string, content: Record<string, unknown>) => void;
  deleteSlide: (id: string) => void;
  setCurrentIndex: (index: number) => void;
}

export const useSlideStore = create<SlideState>()((set) => ({
  slides: [],
  currentIndex: 0,

  setSlides: (slides) => set({ slides }),
  addSlide: (slide) =>
    set((state) => ({ slides: [...state.slides, slide] })),
  updateSlide: (id, content) =>
    set((state) => ({
      slides: state.slides.map((s) =>
        s.id === id ? { ...s, content: { ...s.content, ...content } } : s
      ),
    })),
  deleteSlide: (id) =>
    set((state) => ({
      slides: state.slides.filter((s) => s.id !== id),
      currentIndex: Math.max(0, state.currentIndex - 1),
    })),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
}));
