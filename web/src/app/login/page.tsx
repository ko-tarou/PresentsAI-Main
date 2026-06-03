"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Presentation } from "lucide-react";
import { authApi } from "@shared/api/auth";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { Button } from "@shared/components/ui/Button";
import { Input } from "@shared/components/ui/Input";

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
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary-600 px-12 text-white">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Presentation className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">PresentsAI</span>
        </div>
        <h1 className="text-4xl font-bold text-center leading-tight mb-4">
          プレゼンを、<br />もっとスマートに。
        </h1>
        <p className="text-primary-200 text-center text-lg leading-relaxed max-w-sm">
          AI が発表を支援するプレゼンテーションエディタ。
          スライド作成から発表まで、すべてをひとつの場所で。
        </p>
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          {[
            { value: "∞", label: "スライド" },
            { value: "AI", label: "リアルタイムコーチ" },
            { value: "4", label: "エクスポート形式" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm text-primary-200 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-surface-subtle px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Presentation className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold text-content-primary">PresentsAI</span>
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-bold text-content-primary mb-1">
              {tab === "login" ? "ログイン" : "アカウント作成"}
            </h2>
            <p className="text-sm text-content-secondary mb-6">
              {tab === "login"
                ? "アカウントにサインインしてください"
                : "新しいアカウントを作成します"}
            </p>

            {/* Tabs */}
            <div className="flex rounded-lg bg-surface-muted p-1 mb-6">
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); }}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
                    tab === t
                      ? "bg-white text-content-primary shadow-sm"
                      : "text-content-secondary hover:text-content-primary"
                  }`}
                >
                  {t === "login" ? "ログイン" : "新規登録"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "register" && (
                <Input
                  label="表示名"
                  type="text"
                  placeholder="田中 太郎"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              )}
              <Input
                label="メールアドレス"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                label="パスワード"
                type="password"
                placeholder={tab === "register" ? "8文字以上" : "パスワードを入力"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                hint={tab === "register" ? "8文字以上で設定してください" : undefined}
              />

              {error && (
                <div className="rounded-lg bg-error-light border border-error/20 px-3 py-2.5 text-sm text-error-dark flex items-center gap-2">
                  <span>&#x26A0;</span>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                {tab === "login" ? (
                  <><LogIn className="h-4 w-4" /> ログイン</>
                ) : (
                  <><UserPlus className="h-4 w-4" /> アカウントを作成</>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
