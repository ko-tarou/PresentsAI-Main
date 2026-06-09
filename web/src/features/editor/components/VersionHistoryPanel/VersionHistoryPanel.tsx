"use client";
import { useState, useEffect, useCallback } from "react";
import type * as Y from "yjs";
import { History, RotateCcw, Save } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { versionsApi } from "@shared/api/versions";
import { replaceSlideContent } from "@lib/collab/schema";
import type { SlideVersion } from "@shared/types/version";

interface VersionHistoryPanelProps {
  /** Shared Yjs doc — restore is applied here so the live canvas + peers update. */
  doc: Y.Doc | null;
}

/**
 * Per-slide version history. Snapshots and restores the *active* slide via the
 * backend (`/presentations/:id/slides/:slideId/versions`).
 *
 * Restore is the delicate part: the backend writes the snapshot into
 * `slides.content` (the JSONB projection), but the Yjs doc is the source of
 * truth (ADR-0011). Writing only the projection would be silently clobbered by
 * the next projection of the live doc. So after the backend restore succeeds we
 * also rewrite the slide's objects in the shared doc via {@link replaceSlideContent},
 * which propagates to every peer and re-renders the local canvas through the
 * existing ObjectBinding observer — keeping collaboration intact.
 */
export function VersionHistoryPanel({ doc }: VersionHistoryPanelProps) {
  const presentationId = useEditorStore((s) => s.presentationId);
  const activeSlideId = useEditorStore((s) => s.activeSlideId);
  const canvas = useEditorStore((s) => s.canvas);
  const { accessToken } = useAuthStore();
  const [versions, setVersions] = useState<SlideVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !presentationId || !activeSlideId) return;
    setLoading(true);
    try {
      const res = await versionsApi.list(accessToken, presentationId, activeSlideId);
      setVersions(res.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [accessToken, presentationId, activeSlideId]);

  // Reload whenever the active slide changes — versions are per-slide.
  useEffect(() => {
    load();
  }, [load]);

  const snapshot = useCallback(async () => {
    if (!accessToken || !presentationId || !activeSlideId || !canvas || saving) return;
    setSaving(true);
    try {
      const json = canvas.toJSON() as { version: string; objects: unknown[]; background?: string };
      const created = await versionsApi.create(accessToken, presentationId, activeSlideId, {
        version: json.version,
        objects: (json.objects ?? []) as { id: string }[],
        background: json.background,
      });
      setVersions((prev) => [created, ...prev]);
    } finally {
      setSaving(false);
    }
  }, [accessToken, presentationId, activeSlideId, canvas, saving]);

  const restore = useCallback(
    async (version: SlideVersion) => {
      if (!accessToken || !presentationId || !activeSlideId || restoringId) return;
      setRestoringId(version.ID);
      try {
        await versionsApi.restore(accessToken, presentationId, activeSlideId, version.ID);
        // Reflect the restore into the live doc so peers + canvas update.
        if (doc) replaceSlideContent(doc, activeSlideId, version.Content);
      } finally {
        setRestoringId(null);
      }
    },
    [accessToken, presentationId, activeSlideId, doc, restoringId]
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l bg-white">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-gray-500" />
          <p className="text-xs font-semibold text-gray-600">バージョン履歴</p>
        </div>
        {loading && <span className="text-xs text-gray-400">読み込み中...</span>}
      </div>

      <div className="border-b p-3">
        <button
          onClick={snapshot}
          disabled={saving || !activeSlideId || !canvas}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "保存中..." : "現在の状態を保存"}
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {versions.length === 0 && !loading ? (
          <p className="text-xs text-gray-400">
            このスライドの保存済みバージョンはありません。
          </p>
        ) : (
          versions.map((v) => (
            <div key={v.ID} className="rounded-lg border bg-gray-50 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  バージョン {v.Version}
                </span>
                <span className="text-[10px] text-gray-400">
                  {v.CreatedAt ? new Date(v.CreatedAt).toLocaleString() : ""}
                </span>
              </div>
              <button
                onClick={() => restore(v)}
                disabled={restoringId !== null}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                {restoringId === v.ID ? "復元中..." : "このバージョンに復元"}
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
