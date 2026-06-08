"use client";
import { useState, useEffect } from "react";
import { Square, Sparkles, ArrowLeftToLine, ArrowRightToLine, ZoomIn, Play } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useSlideStore } from "../../stores/slideStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { playTransition, type TransitionType } from "@lib/fabric/animation";
import type { SlideTransitionType } from "@shared/types/slide";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

const TRANSITION_DURATION_MS = 400;

const TRANSITIONS: { type: TransitionType; label: string; icon: React.ReactNode }[] = [
  { type: "none", label: "なし", icon: <Square /> },
  { type: "fade", label: "フェード", icon: <Sparkles /> },
  { type: "slide-left", label: "スライド左", icon: <ArrowLeftToLine /> },
  { type: "slide-right", label: "スライド右", icon: <ArrowRightToLine /> },
  { type: "zoom", label: "ズーム", icon: <ZoomIn /> },
];

// Map the preview-level transition type to the persisted model type.
// "slide-left" / "slide-right" both store as "slide" / "push" respectively.
export function toModelTransition(t: TransitionType): SlideTransitionType {
  switch (t) {
    case "slide-left": return "slide";
    case "slide-right": return "push";
    default: return t;
  }
}

// Reverse mapping: restore the UI selection from a persisted model type.
export function fromModelTransition(t: SlideTransitionType | undefined): TransitionType {
  switch (t) {
    case "slide": return "slide-left";
    case "push": return "slide-right";
    case undefined: return "none";
    default: return t;
  }
}

export function TransitionTab() {
  const { activeSlideId, presentationId } = useEditorStore();
  const { slides, updateSlideMeta } = useSlideStore();
  const { accessToken } = useAuthStore();
  const [selected, setSelected] = useState<TransitionType>("none");

  const currentSlide = slides.find((s) => s.id === activeSlideId);

  // Reflect the saved transition when the active slide changes.
  useEffect(() => {
    setSelected(fromModelTransition(currentSlide?.transition?.type));
  }, [activeSlideId, currentSlide?.transition?.type]);

  async function select(type: TransitionType) {
    setSelected(type);
    if (!activeSlideId) return;
    const transition =
      type === "none"
        ? { type: "none" as SlideTransitionType }
        : { type: toModelTransition(type), durationMs: TRANSITION_DURATION_MS };
    updateSlideMeta(activeSlideId, { transition });
    if (accessToken && presentationId) {
      await slidesApi.updateMeta(accessToken, presentationId, activeSlideId, { transition });
    }
  }

  function preview() {
    const el = useEditorStore.getState().canvas?.wrapperEl?.parentElement;
    if (el) void playTransition(el, selected);
  }

  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup label="画面切り替え">
        <div className="flex items-center gap-0.5">
          {TRANSITIONS.map((t) => (
            <RibbonBigButton
              key={t.type}
              icon={t.icon}
              label={t.label}
              active={selected === t.type}
              onClick={() => void select(t.type)}
            />
          ))}
        </div>
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="プレビュー">
        <RibbonBigButton
          icon={<Play />}
          label="プレビュー"
          onClick={preview}
          disabled={selected === "none"}
          title="選択した画面切り替えを再生"
        />
      </RibbonGroup>
    </div>
  );
}
