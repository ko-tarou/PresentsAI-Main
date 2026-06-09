"use client";
import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { commentsApi } from "@shared/api/comments";
import { Button, Textarea } from "@shared/components/ui";
import type { Comment } from "@shared/types/comment";

// Presentation-level comments. Slide/object anchoring is intentionally out of
// scope for this panel and tracked as a follow-up PR.
export function CommentsPanel() {
  const presentationId = useEditorStore((s) => s.presentationId);
  const { accessToken } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !presentationId) return;
    setLoading(true);
    try {
      const res = await commentsApi.list(accessToken, presentationId);
      setComments(res.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [accessToken, presentationId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(async () => {
    const text = body.trim();
    if (!text || !accessToken || !presentationId || posting) return;
    setPosting(true);
    try {
      const created = await commentsApi.create(accessToken, presentationId, { body: text });
      setComments((prev) => [...prev, created]);
      setBody("");
    } finally {
      setPosting(false);
    }
  }, [body, accessToken, presentationId, posting]);

  return (
    <aside className="side-panel w-64">
      <div className="side-panel-header">
        <p className="side-panel-title">コメント</p>
        {loading && <span className="text-xs text-content-tertiary">読み込み中...</span>}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {comments.length === 0 && !loading ? (
          <p className="text-xs text-content-tertiary">まだコメントはありません。</p>
        ) : (
          comments.map((c) => (
            <div key={c.ID} className="rounded-lg border border-border bg-surface-subtle p-2">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-xs font-medium text-content-secondary">
                  {c.AuthorName || "匿名"}
                </span>
                <span className="text-[10px] text-content-tertiary">
                  {c.CreatedAt ? new Date(c.CreatedAt).toLocaleString() : ""}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-xs text-content-secondary">
                {c.Body}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="コメントを追加..."
          className="h-16 resize-none text-xs"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={submit}
          disabled={!body.trim() || posting}
          className="mt-2 w-full"
        >
          {posting ? "投稿中..." : "投稿"}
        </Button>
      </div>
    </aside>
  );
}
