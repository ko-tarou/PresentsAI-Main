"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { membersApi, type Member, type MemberRole } from "@shared/api/members";

interface ShareModalProps {
  presentationId: string;
  presentationTitle: string;
  onClose: () => void;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "オーナー",
  editor: "編集者",
  viewer: "閲覧者",
};

const ROLE_BADGE: Record<MemberRole, string> = {
  owner: "bg-purple-100 text-purple-700",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
};

export function ShareModal({ presentationId, presentationTitle, onClose }: ShareModalProps) {
  const { accessToken } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("viewer");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"view" | "present" | null>(null);

  const viewUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/view/${presentationId}`;
  const presentUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/present/${presentationId}`;

  const loadMembers = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await membersApi.list(accessToken, presentationId);
      setMembers(res.items ?? []);
    } catch { /* not yet shared — empty list is fine */ }
    finally { setLoading(false); }
  }, [accessToken, presentationId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !email.trim()) return;
    setInviting(true);
    setError("");
    try {
      const member = await membersApi.invite(accessToken, presentationId, email.trim(), role);
      setMembers(prev => [...prev, member]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "招待に失敗しました");
    } finally { setInviting(false); }
  }

  async function handleRoleChange(member: Member, newRole: MemberRole) {
    if (!accessToken || newRole === "owner") return;
    try {
      await membersApi.updateRole(accessToken, presentationId, member.userId, newRole);
      setMembers(prev => prev.map(m => m.userId === member.userId ? { ...m, role: newRole } : m));
    } catch { /* ignore */ }
  }

  async function handleRemove(member: Member) {
    if (!accessToken) return;
    try {
      await membersApi.remove(accessToken, presentationId, member.userId);
      setMembers(prev => prev.filter(m => m.userId !== member.userId));
    } catch { /* ignore */ }
  }

  async function copyLink(url: string, type: "view" | "present") {
    await navigator.clipboard.writeText(url);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    // Modal backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">共有設定</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-72">{presentationTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Invite form */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">ユーザーを招待</p>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="メールアドレスを入力..."
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
              <select
                value={role}
                onChange={e => setRole(e.target.value as MemberRole)}
                className="rounded-lg border px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="viewer">閲覧者</option>
                <option value="editor">編集者</option>
              </select>
              <button
                type="submit"
                disabled={inviting || !email.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                {inviting ? "招待中..." : "招待"}
              </button>
            </form>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>

          {/* Members list */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">メンバー ({members.length})</p>
            {loading ? (
              <p className="text-xs text-gray-400">読み込み中...</p>
            ) : members.length === 0 ? (
              <div className="rounded-xl bg-gray-50 py-6 text-center">
                <p className="text-sm text-gray-400">まだ共有されていません</p>
                <p className="text-xs text-gray-400 mt-1">メールアドレスを入力して招待しましょう</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-52 overflow-y-auto">
                {members.map(member => (
                  <li key={member.userId} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-gray-50">
                    {/* Avatar */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {(member.displayName || member.email).charAt(0).toUpperCase()}
                    </div>

                    {/* Name / email */}
                    <div className="flex-1 min-w-0">
                      {member.displayName && (
                        <p className="text-sm font-medium text-gray-800 truncate">{member.displayName}</p>
                      )}
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>

                    {/* Role */}
                    {member.role === "owner" ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={e => handleRoleChange(member, e.target.value as MemberRole)}
                        className="rounded-lg border px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value="viewer">閲覧者</option>
                        <option value="editor">編集者</option>
                      </select>
                    )}

                    {/* Remove */}
                    {member.role !== "owner" && (
                      <button
                        onClick={() => handleRemove(member)}
                        className="rounded-full p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                        title="削除"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Public links */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">公開リンク</p>
            <div className="space-y-2">
              {[
                { label: "閲覧用（認証不要）", url: viewUrl, type: "view" as const, color: "border-gray-200" },
                { label: "プレゼンター用", url: presentUrl, type: "present" as const, color: "border-gray-200" },
              ].map(({ label, url, type, color }) => (
                <div key={type} className={`flex items-center gap-2 rounded-xl border ${color} p-3`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600">{label}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{url}</p>
                  </div>
                  <button
                    onClick={() => copyLink(url, type)}
                    className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    {copied === type ? "✓ コピー済み" : "コピー"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
