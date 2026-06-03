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
  content: SlideContent;
  createdAt: string;
  updatedAt: string;
}

export interface SlideContent {
  version: string;
  objects: FabricObject[];
  background?: string;
}

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
