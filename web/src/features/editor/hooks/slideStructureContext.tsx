"use client";
import { createContext, useContext } from "react";

/** Collaborative slide-structure operations exposed to the editor UI. */
export interface SlideStructureOps {
  addSlide: (id: string, position?: number) => void;
  removeSlide: (id: string) => void;
  moveSlide: (id: string, toIndex: number) => void;
  ready: boolean;
}

/**
 * Provides the collaborative slide-structure ops (from {@link useSlideStructure})
 * to nested editor panels (SlidePanel / SlideSorter) without prop drilling. The
 * default is a no-op so panels render safely before the doc connects or in
 * isolation (e.g. tests / storybook).
 */
const noop: SlideStructureOps = {
  addSlide: () => {},
  removeSlide: () => {},
  moveSlide: () => {},
  ready: false,
};

const SlideStructureContext = createContext<SlideStructureOps>(noop);

export const SlideStructureProvider = SlideStructureContext.Provider;

/** Access the collaborative slide-structure ops in a nested panel. */
export function useSlideStructureOps(): SlideStructureOps {
  return useContext(SlideStructureContext);
}
