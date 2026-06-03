"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { presentationsApi, type Presentation } from "@shared/api/presentations";
import { ShareButton } from "@features/dashboard/components/ShareButton";

export default function DashboardPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  const loadPresentations = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await presentationsApi.list(accessToken);
      setPresentations(res.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadPresentations(); }, [loadPresentations]);

  async function handleCreate() {
    if (!accessToken) return;
    setCreating(true);
    try {
      const p = await presentationsApi.create(accessToken, "Untitled");
      router.push(`/editor/${p.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    await presentationsApi.delete(accessToken, id);
    setPresentations((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = presentations
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortBy === "name"
        ? a.title.localeCompare(b.title)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  return (
    <main role="main" className="min-h-screen bg-gray-50">
      <a href="#dashboard-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded bg-blue-600 px-3 py-1 text-sm text-white">
        コンテンツへスキップ
      </a>
      <header role="banner" className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">PresentsAI</h1>
        <button
          onClick={handleCreate}
          disabled={creating}
          aria-label="新しいプレゼンテーションを作成"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "作成中..." : "+ 新しいプレゼンテーション"}
        </button>
      </header>

      <div id="dashboard-content" className="mx-auto max-w-6xl p-6">
        {/* Search and sort controls */}
        <div className="mb-6 flex items-center gap-3">
          <input
            type="search"
            placeholder="プレゼンテーションを検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="プレゼンテーションを検索"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-1 rounded-lg border bg-white p-1">
            <button
              onClick={() => setSortBy("date")}
              className={`rounded px-3 py-1 text-xs font-medium ${sortBy === "date" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              日付順
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`rounded px-3 py-1 text-xs font-medium ${sortBy === "name" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              名前順
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
            <p className="text-xl font-semibold text-gray-600">
              {search ? "検索結果がありません" : "プレゼンテーションがありません"}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {search ? `「${search}」に一致するものが見つかりませんでした` : "上のボタンから最初のプレゼンテーションを作成しましょう"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <div key={p.id} className="group relative rounded-xl border bg-white shadow-sm transition hover:shadow-md">
                <button onClick={() => router.push(`/editor/${p.id}`)} className="block w-full p-4 text-left">
                  <div className="mb-3 aspect-video w-full rounded-lg bg-gradient-to-br from-blue-50 to-gray-100" />
                  <p className="truncate text-sm font-medium text-gray-900">{p.title}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(p.updatedAt).toLocaleDateString("ja-JP")}
                  </p>
                </button>
                <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                  <ShareButton presentationId={p.id} presentationTitle={p.title} />
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    aria-label="削除"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
