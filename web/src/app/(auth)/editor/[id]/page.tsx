"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Presentation, Bot, Mic } from "lucide-react";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { useEditorStore } from "@features/editor/stores/editorStore";
import { useSlideStore } from "@features/editor/stores/slideStore";
import { slidesApi } from "@shared/api/slides";
import { presentationsApi } from "@shared/api/presentations";
import { ShareButton } from "@features/dashboard/components/ShareButton";
import { EditorCanvas } from "@features/editor/components/Canvas";
import { SlidePanel } from "@features/editor/components/SlidePanel";
import { Ribbon } from "@features/editor/components/Ribbon";
import { StatusBar } from "@features/editor/components/StatusBar";
import { BooleanToolbar } from "@features/editor/components/Toolbar";
import { ExportButton } from "@features/editor/components/Toolbar/ExportButton";
import { QuickAccess } from "@features/editor/components/QuickAccess";
import { StylePanel, TokenPanel, ImagePanel } from "@features/editor/components/PropertyPanel";
import { AIPanel } from "@features/ai/components/AIPanel";
import { RealtimeCoach } from "@features/ai/components/RealtimeCoach";
import { SpeakerNotesPanel } from "@features/editor/components/SpeakerNotes";
import type { Slide } from "@shared/types/slide";

type AITab = "ai" | "coach" | null;

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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
    <div className="flex h-screen flex-col overflow-hidden bg-surface-subtle">
      {/* Header */}
      <header className="flex h-12 items-center border-b border-border bg-surface px-4 shrink-0 gap-3">
        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Presentation title */}
        <div className="flex items-center gap-2 min-w-0">
          <Presentation className="h-4 w-4 text-primary-500 shrink-0" />
          <span
            className="text-sm font-semibold text-content-primary truncate max-w-48 cursor-pointer hover:text-primary-600"
            title={title}
          >
            {title}
          </span>
          <span className="text-xs text-content-tertiary shrink-0">({slides.length} スライド)</span>
        </div>

        {/* Quick Access Toolbar: undo / redo / save */}
        <div className="h-5 w-px bg-border shrink-0" />
        <QuickAccess />

        <div className="flex-1" />

        {/* Export */}
        <ExportButton />

        {/* Share button */}
        <ShareButton presentationId={id} presentationTitle={title} />

        {/* AI toggles */}
        <button
          onClick={() => setAiTab(prev => prev === "ai" ? null : "ai")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            aiTab === "ai" ? "bg-primary-100 text-primary-700" : "text-content-secondary hover:bg-surface-muted hover:text-content-primary"
          }`}
        >
          <Bot className="h-3.5 w-3.5" />
          AI
        </button>
        <button
          onClick={() => setAiTab(prev => prev === "coach" ? null : "coach")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            aiTab === "coach" ? "bg-success/15 text-success-dark" : "text-content-secondary hover:bg-surface-muted hover:text-content-primary"
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          コーチ
        </button>
      </header>

      {/* Ribbon */}
      <Ribbon />
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

      {/* Bottom status bar */}
      <StatusBar />
    </div>
  );
}
