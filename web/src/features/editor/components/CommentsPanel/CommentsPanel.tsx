"use client";
import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { commentsApi } from "@shared/api/comments";
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
    <aside className="flex w-64 shrink-0 flex-col border-l bg-white">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-xs font-semibold text-gray-600">コメント</p>
        {loading && <span className="text-xs text-gray-400">読み込み中...</span>}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {comments.length === 0 && !loading ? (
          <p className="text-xs text-gray-400">まだコメントはありません。</p>
        ) : (
          comments.map((c) => (
            <div key={c.ID} className="rounded-lg border bg-gray-50 p-2">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {c.AuthorName || "匿名"}
                </span>
                <span className="text-[10px] text-gray-400">
                  {c.CreatedAt ? new Date(c.CreatedAt).toLocaleString() : ""}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-xs text-gray-700">
                {c.Body}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="コメントを追加..."
          className="w-full h-16 resize-none rounded-lg border p-2 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!body.trim() || posting}
          className="mt-2 w-full rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {posting ? "投稿中..." : "投稿"}
        </button>
      </div>
    </aside>
  );
}
