"use client";
import { useEffect, useRef } from "react";
import { CollabProvider } from "@lib/collab/provider";
import { useEditorStore } from "../stores/editorStore";
import { useSlideStore } from "../stores/slideStore";
import { loadFromJSON, toJSON } from "@lib/fabric/canvas";

export function useCollaboration(presentationId: string | null) {
  const providerRef = useRef<CollabProvider | null>(null);
  const { canvas, activeSlideId } = useEditorStore();
  const { updateSlide } = useSlideStore();

  useEffect(() => {
    if (!presentationId) return;
    providerRef.current = new CollabProvider(presentationId, (msg) => {
      if (msg.type === "update" && canvas && activeSlideId) {
        try {
          const data =
            typeof msg.data === "string"
              ? (JSON.parse(msg.data) as Record<string, unknown>)
              : (msg.data as Record<string, unknown>);
          loadFromJSON(canvas, data).then(() => {
            canvas.renderAll();
            updateSlide(activeSlideId, data);
          });
        } catch { /* ignore malformed messages */ }
      }
    });
    return () => {
      providerRef.current?.destroy();
    };
  }, [presentationId, canvas, activeSlideId, updateSlide]);

  const broadcast = (slideContent: Record<string, unknown>) => {
    providerRef.current?.send({ type: "update", data: slideContent });
  };

  return { broadcast };
}
