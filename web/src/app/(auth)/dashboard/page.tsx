"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, SortAsc, Presentation,
  MoreVertical, Trash2, Edit3, Clock,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { presentationsApi, type Presentation as PresentationType } from "@shared/api/presentations";
import { ShareButton } from "@features/dashboard/components/ShareButton";
import { ImportPptxButton } from "@features/dashboard/components/ImportPptxButton";
import { Button } from "@shared/components/ui/Button";
import { Avatar } from "@shared/components/ui/Avatar";

export default function DashboardPage() {
  const { accessToken, userId, clearTokens } = useAuthStore();
  const router = useRouter();
  const [presentations, setPresentations] = useState<PresentationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await presentationsApi.list(accessToken);
      setPresentations(res.items ?? []);
    } finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!accessToken) return;
    setCreating(true);
    try {
      const p = await presentationsApi.create(accessToken, "無題のプレゼンテーション");
      router.push(`/editor/${p.id}`);
    } finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    setPresentations(prev => prev.filter(p => p.id !== id));
    setMenuOpen(null);
    await presentationsApi.delete(accessToken, id);
  }

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  const filtered = presentations
    .filter(p => (p.title ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortBy === "name"
        ? (a.title ?? "").localeCompare(b.title ?? "")
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "今日";
    if (diffDays === 1) return "昨日";
    if (diffDays < 7) return `${diffDays}日前`;
    return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-surface-subtle">
      {/* Top navigation */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Presentation className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-content-primary">PresentsAI</span>
          </div>

          {/* Right: avatar + logout */}
          <div className="flex items-center gap-3">
            <Avatar name={userId ?? "User"} size="sm" />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">マイプレゼンテーション</h1>
            <p className="text-sm text-content-secondary mt-0.5">
              {presentations.length} 件のプレゼンテーション
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ImportPptxButton />
            <Button variant="primary" size="md" onClick={handleCreate} loading={creating}>
              <Plus className="h-4 w-4" />
              新規作成
            </Button>
          </div>
        </div>

        {/* Search + sort bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-tertiary pointer-events-none" />
            <input
              type="search"
              placeholder="プレゼンテーションを検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 h-9"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortBy(s => s === "date" ? "name" : "date")}
            className="gap-1.5"
          >
            {sortBy === "date"
              ? <><Clock className="h-3.5 w-3.5" /> 更新日順</>
              : <><SortAsc className="h-3.5 w-3.5" /> 名前順</>}
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-video bg-surface-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-surface-muted rounded w-3/4" />
                  <div className="h-3 bg-surface-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 mb-4">
              <Presentation className="h-8 w-8 text-primary-500" />
            </div>
            <h2 className="text-lg font-semibold text-content-primary">
              {search ? "一致するプレゼンテーションが見つかりません" : "まだプレゼンテーションがありません"}
            </h2>
            <p className="text-sm text-content-secondary mt-1 max-w-xs">
              {search
                ? "別のキーワードで検索してみてください"
                : "「新規作成」ボタンから最初のプレゼンテーションを作成しましょう"}
            </p>
            {!search && (
              <Button variant="primary" size="md" onClick={handleCreate} loading={creating} className="mt-5">
                <Plus className="h-4 w-4" /> 最初のプレゼンを作成
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map(p => (
              <div
                key={p.id}
                className="card group overflow-hidden transition-shadow hover:shadow-card-hover cursor-pointer relative"
                onClick={() => router.push(`/editor/${p.id}`)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-primary-50 to-surface-muted relative overflow-hidden">
                  {p.thumbnailUrl ? (
                    <img src={p.thumbnailUrl} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Presentation className="h-10 w-10 text-primary-200" />
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-content-primary truncate">{p.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-content-tertiary flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(p.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* Context menu button */}
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-content-secondary opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white hover:text-content-primary"
                  aria-label="メニュー"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Dropdown menu */}
                {menuOpen === p.id && (
                  <div
                    className="absolute right-2 top-9 z-20 w-40 rounded-xl border border-border bg-white py-1 shadow-modal"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { router.push(`/editor/${p.id}`); setMenuOpen(null); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-content-primary hover:bg-surface-subtle"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-content-tertiary" /> 編集
                    </button>
                    <div className="px-3 py-2" onClick={() => setMenuOpen(null)}>
                      <ShareButton presentationId={p.id} presentationTitle={p.title} />
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error-light"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> 削除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}
