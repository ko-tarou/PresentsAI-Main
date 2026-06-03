"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { useEditorStore } from "@features/editor/stores/editorStore";
import { useSlideStore } from "@features/editor/stores/slideStore";
import { slidesApi } from "@shared/api/slides";
import { presentationsApi } from "@shared/api/presentations";
import { ShareButton } from "@features/dashboard/components/ShareButton";
import { EditorCanvas } from "@features/editor/components/Canvas";
import { SlidePanel } from "@features/editor/components/SlidePanel";
import { MenuBar } from "@features/editor/components/MenuBar";
import { TextFormatBar, BooleanToolbar } from "@features/editor/components/Toolbar";
import { StylePanel, TokenPanel, ImagePanel } from "@features/editor/components/PropertyPanel";
import { AIPanel } from "@features/ai/components/AIPanel";
import { RealtimeCoach } from "@features/ai/components/RealtimeCoach";
import { SpeakerNotesPanel } from "@features/editor/components/SpeakerNotes";
import type { Slide } from "@shared/types/slide";

type AITab = "ai" | "coach" | null;

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuthStore();
  const { setPresentationId, setActiveSlide, activeTool } = useEditorStore();
  const { setSlides, slides } = useSlideStore();
  const [aiTab, setAiTab] = useState<AITab>(null);
  const [title, setTitle] = useState("Untitled");

  useEffect(() => {
    if (!accessToken || !id) return;
    setPresentationId(id);
    slidesApi.list(accessToken, id).then((res) => {
      const slideList = res.items as Slide[];
      setSlides(slideList);
      if (slideList.length > 0) setActiveSlide(slideList[0].id);
    });
    presentationsApi.get(accessToken, id).then(p => setTitle(p.title));
  }, [id, accessToken, setPresentationId, setSlides, setActiveSlide]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      {/* Header */}
      <header className="flex h-11 items-center border-b bg-white px-4 shrink-0 gap-2">
        <span className="text-sm font-bold text-gray-800">PresentsAI</span>
        <span className="text-xs text-gray-400">({slides.length} スライド)</span>
        <div className="flex-1" />
        <ShareButton presentationId={id} presentationTitle={title} />
        <button
          onClick={() => setAiTab(prev => prev === "ai" ? null : "ai")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${aiTab === "ai" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"}`}
        >
          🤖 AI
        </button>
        <button
          onClick={() => setAiTab(prev => prev === "coach" ? null : "coach")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${aiTab === "coach" ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"}`}
        >
          🎙️ コーチ
        </button>
      </header>

      {/* Toolbar rows */}
      <MenuBar />
      <TextFormatBar />
      {activeTool === "pen" && <BooleanToolbar />}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <SlidePanel />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <EditorCanvas />
          </div>
          <SpeakerNotesPanel />
        </main>
        <aside className="flex w-56 shrink-0 flex-col border-l bg-white overflow-y-auto">
          <StylePanel />
          <TokenPanel />
          <ImagePanel />
        </aside>
        {aiTab && (
          <aside className="flex w-64 shrink-0 flex-col border-l bg-white overflow-y-auto">
            {aiTab === "ai" ? <AIPanel /> : <RealtimeCoach />}
          </aside>
        )}
      </div>
    </div>
  );
}
