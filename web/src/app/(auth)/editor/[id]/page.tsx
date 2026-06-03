"use client";
import { useEffect } from "react";
import { use } from "react";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { useEditorStore } from "@features/editor/stores/editorStore";
import { useSlideStore } from "@features/editor/stores/slideStore";
import { slidesApi } from "@shared/api/slides";
import { EditorCanvas } from "@features/editor/components/Canvas";
import { SlidePanel } from "@features/editor/components/SlidePanel";
import { MenuBar } from "@features/editor/components/MenuBar";
import { TextFormatBar } from "@features/editor/components/Toolbar";
import { StylePanel } from "@features/editor/components/PropertyPanel";
import type { Slide } from "@shared/types/slide";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuthStore();
  const { setPresentationId, setActiveSlide } = useEditorStore();
  const { setSlides, slides } = useSlideStore();

  useEffect(() => {
    if (!accessToken || !id) return;
    setPresentationId(id);
    slidesApi.list(accessToken, id).then((res) => {
      const slideList = res.items as Slide[];
      setSlides(slideList);
      if (slideList.length > 0) setActiveSlide(slideList[0].id);
    });
  }, [id, accessToken, setPresentationId, setSlides, setActiveSlide]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 items-center border-b bg-white px-4 text-sm font-semibold text-gray-700 shrink-0">
        PresentsAI Editor
        <span className="ml-2 text-xs font-normal text-gray-400">({slides.length} スライド)</span>
      </header>
      <MenuBar />
      <TextFormatBar />
      <div className="flex flex-1 overflow-hidden">
        <SlidePanel />
        <EditorCanvas />
        <StylePanel />
      </div>
    </div>
  );
}
