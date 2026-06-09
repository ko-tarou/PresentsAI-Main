export interface Presentation {
  id: string;
  title: string;
  thumbnailUrl?: string;
  slideCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Slide {
  id: string;
  presentationId: string;
  position: number;
  thumbnailUrl?: string;
  notes?: string;
  content: SlideContent;
  /** Slide-level entrance/exit transition played when the slide appears. */
  transition?: SlideTransition;
  /** Per-element animations played within the slide. */
  animations?: ElementAnimation[];
  /** Reference to the layout template this slide was created from. */
  layoutRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlideContent {
  version: string;
  objects: FabricObject[];
  background?: string;
}

/** Slide-level transition. `type` "none" means no transition (default). */
export interface SlideTransition {
  type: SlideTransitionType;
  /** Duration in milliseconds. */
  durationMs?: number;
}

export type SlideTransitionType =
  | "none"
  | "fade"
  | "slide"
  | "push"
  | "zoom";

/** Animation applied to a single canvas element, identified by its object id. */
export interface ElementAnimation {
  /** Fabric object id (or custom element id) this animation targets. */
  targetId: string;
  type: ElementAnimationType;
  /** Play order within the slide (ascending). */
  order: number;
  /** Duration in milliseconds. */
  durationMs?: number;
  /** Delay before the animation starts, in milliseconds. */
  delayMs?: number;
}

export type ElementAnimationType =
  | "fadeIn"
  | "fadeOut"
  | "slideIn"
  | "slideOut"
  | "zoomIn"
  | "zoomOut"
  | "bounce";

export type FabricObject = Record<string, unknown>;

export type EditorTool =
  | "select"
  | "text"
  | "rect"
  | "circle"
  | "triangle"
  | "line"
  | "arrow"
  | "image"
  | "pen";
