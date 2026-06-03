"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@shared/api/auth";
import { useAuthStore } from "@features/dashboard/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const pair =
        tab === "login"
          ? await authApi.login(email, password)
          : await authApi.register(email, password, displayName);
      setTokens(pair.accessToken, pair.refreshToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main role="main" className="flex min-h-screen items-center justify-center bg-gray-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded bg-blue-600 px-3 py-1 text-sm text-white">
        コンテンツへスキップ
      </a>
      <div id="main-content" className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">PresentsAI</h1>
        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "login" ? "ログイン" : "新規登録"}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <input
              type="text"
              placeholder="表示名"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          )}
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder={tab === "register" ? "パスワード（8文字以上）" : "パスワード"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "処理中..." : tab === "login" ? "ログイン" : "アカウント作成"}
          </button>
        </form>
      </div>
    </main>
  );
}
