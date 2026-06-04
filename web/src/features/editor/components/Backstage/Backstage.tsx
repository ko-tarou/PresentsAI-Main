"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus2, FolderOpen, Save, Download, Printer, Share2,
  X, ArrowLeft, FileText, FileImage, FileCode, Presentation,
} from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { slidesApi } from "@shared/api/slides";
import { toJSON } from "@lib/fabric/canvas";
import { exportToPDF } from "@lib/export/pdf";
import { exportToPNG, exportToSVG } from "@lib/export/png";
import { exportToPPTX } from "@lib/export/pptx";
import type { SlideContent } from "@shared/types/slide";

type Section = "new" | "open" | "save" | "export" | "print" | "share";

const MENU: { key: Section; label: string; Icon: typeof FilePlus2 }[] = [
  { key: "new", label: "新規", Icon: FilePlus2 },
  { key: "open", label: "開く", Icon: FolderOpen },
  { key: "save", label: "上書き保存", Icon: Save },
  { key: "export", label: "エクスポート", Icon: Download },
  { key: "print", label: "印刷", Icon: Printer },
  { key: "share", label: "共有", Icon: Share2 },
];

interface BackstageProps {
  open: boolean;
  onClose: () => void;
}

export function Backstage({ open, onClose }: BackstageProps) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("new");
  const { canvas, activeSlideId, presentationId } = useEditorStore();
  const setDirty = useEditorStore((s) => s.setDirty);
  const { accessToken } = useAuthStore();

  const [saveState, setSaveState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [copied, setCopied] = useState<"view" | "present" | null>(null);

  if (!open) return null;

  async function handleSave() {
    if (!canvas || !accessToken || !presentationId || !activeSlideId) return;
    setSaveState("saving");
    try {
      const content = toJSON(canvas) as unknown as SlideContent;
      await slidesApi.updateContent(accessToken, presentationId, activeSlideId, content);
      setDirty(false);
      setSaveState("done");
    } catch {
      setSaveState("error");
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const viewUrl = `${origin}/view/${presentationId ?? ""}`;
  const presentUrl = `${origin}/present/${presentationId ?? ""}`;

  async function copyLink(url: string, type: "view" | "present") {
    await navigator.clipboard.writeText(url);
    setCopied(type);
    setTimeout(() => setCopied((c) => (c === type ? null : c)), 2000);
  }

  return (
    <div className="fixed inset-0 z-[1100] flex bg-surface">
      {/* Left sidebar */}
      <div className="flex w-[220px] shrink-0 flex-col bg-primary-700 text-white">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-4 text-sm font-medium text-white/90 hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
          戻る
        </button>
        <nav className="mt-2 flex flex-col">
          {MENU.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { setSection(key); setSaveState("idle"); }}
              className={
                "flex items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors " +
                (section === key ? "bg-white/15 font-medium" : "text-white/85 hover:bg-white/10")
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3 px-5 py-2.5 text-left text-sm text-white/85 transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" />
            閉じる
          </button>
        </nav>
      </div>

      {/* Right content panel */}
      <div className="flex-1 overflow-y-auto p-10">
        {section === "new" && (
          <Panel title="新規">
            <button
              onClick={() => router.push("/dashboard")}
              className="btn btn-primary gap-2"
            >
              <FilePlus2 className="h-4 w-4" />
              新しいプレゼンテーション
            </button>
          </Panel>
        )}

        {section === "open" && (
          <Panel title="開く">
            <button
              onClick={() => router.push("/dashboard")}
              className="btn btn-primary gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              ダッシュボードを開く
            </button>
          </Panel>
        )}

        {section === "save" && (
          <Panel title="上書き保存">
            <button
              onClick={handleSave}
              disabled={!canvas || saveState === "saving"}
              className="btn btn-primary gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saveState === "saving" ? "保存中..." : "保存"}
            </button>
            {saveState === "done" && (
              <p className="mt-3 text-sm font-medium text-primary-700">保存しました</p>
            )}
            {saveState === "error" && (
              <p className="mt-3 text-sm font-medium text-red-600">保存に失敗しました</p>
            )}
          </Panel>
        )}

        {section === "export" && (
          <Panel title="エクスポート">
            <div className="grid max-w-2xl grid-cols-2 gap-4">
              {[
                { l: "PDF", desc: "PDF として保存", Icon: FileText, fn: () => exportToPDF(canvas!) },
                { l: "PNG", desc: "画像として保存", Icon: FileImage, fn: () => exportToPNG(canvas!) },
                { l: "SVG", desc: "ベクター形式で保存", Icon: FileCode, fn: () => exportToSVG(canvas!) },
                { l: "PowerPoint", desc: "PPTX として保存", Icon: Presentation, fn: () => exportToPPTX(canvas!) },
              ].map(({ l, desc, Icon, fn }) => (
                <button
                  key={l}
                  onClick={() => { if (canvas) fn(); }}
                  disabled={!canvas}
                  className="flex items-center gap-4 rounded-xl border border-border p-5 text-left transition-colors hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Icon className="h-8 w-8 text-primary-600" />
                  <div>
                    <p className="text-sm font-semibold text-content-primary">{l}</p>
                    <p className="text-xs text-content-secondary">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        )}

        {section === "print" && (
          <Panel title="印刷">
            <button
              onClick={() => { if (canvas) exportToPDF(canvas); }}
              disabled={!canvas}
              className="btn btn-primary gap-2 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              印刷
            </button>
            <p className="mt-3 text-sm text-content-secondary">
              PDF として保存して印刷してください
            </p>
          </Panel>
        )}

        {section === "share" && (
          <Panel title="共有">
            <div className="max-w-2xl space-y-3">
              {[
                { label: "閲覧用リンク（認証不要）", url: viewUrl, type: "view" as const },
                { label: "プレゼンター用リンク", url: presentUrl, type: "present" as const },
              ].map(({ label, url, type }) => (
                <div key={type} className="flex items-center gap-3 rounded-xl border border-border p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-content-secondary">{label}</p>
                    <p className="mt-0.5 truncate text-xs text-content-tertiary">{url}</p>
                  </div>
                  <button
                    onClick={() => copyLink(url, type)}
                    className="shrink-0 rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-medium text-content-primary hover:bg-surface-subtle"
                  >
                    {copied === type ? "コピー済み" : "コピー"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-content-primary">{title}</h2>
      {children}
    </div>
  );
}
