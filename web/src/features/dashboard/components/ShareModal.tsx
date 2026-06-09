"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { membersApi, type Member, type MemberRole } from "@shared/api/members";
import { Avatar, Button, Modal, RoleBadge, Select } from "@shared/components/ui";

interface ShareModalProps {
  presentationId: string;
  presentationTitle: string;
  onClose: () => void;
}

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
    <Modal open onClose={onClose} title="共有設定" subtitle={presentationTitle} size="lg">
      <div className="p-6 space-y-6">
        {/* Invite form */}
        <div>
          <p className="text-sm font-semibold text-content-secondary mb-3">ユーザーを招待</p>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="メールアドレスを入力..."
              className="input flex-1"
              required
            />
            <Select value={role} onChange={e => setRole(e.target.value as MemberRole)}>
              <option value="viewer">閲覧者</option>
              <option value="editor">編集者</option>
            </Select>
            <Button type="submit" variant="primary" disabled={inviting || !email.trim()} className="whitespace-nowrap">
              {inviting ? "招待中..." : "招待"}
            </Button>
          </form>
          {error && <p className="mt-2 text-xs text-error">{error}</p>}
        </div>

        {/* Members list */}
        <div>
          <p className="text-sm font-semibold text-content-secondary mb-3">メンバー ({members.length})</p>
          {loading ? (
            <p className="text-xs text-content-tertiary">読み込み中...</p>
          ) : members.length === 0 ? (
            <div className="rounded-xl bg-surface-subtle py-6 text-center">
              <p className="text-sm text-content-tertiary">まだ共有されていません</p>
              <p className="text-xs text-content-tertiary mt-1">メールアドレスを入力して招待しましょう</p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-52 overflow-y-auto">
              {members.map(member => (
                <li key={member.userId} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-subtle">
                  <Avatar name={member.displayName || member.email} size="sm" className="shrink-0" />

                  {/* Name / email */}
                  <div className="flex-1 min-w-0">
                    {member.displayName && (
                      <p className="text-sm font-medium text-content-primary truncate">{member.displayName}</p>
                    )}
                    <p className="text-xs text-content-secondary truncate">{member.email}</p>
                  </div>

                  {/* Role */}
                  {member.role === "owner" ? (
                    <RoleBadge role={member.role} />
                  ) : (
                    <Select
                      value={member.role}
                      onChange={e => handleRoleChange(member, e.target.value as MemberRole)}
                      className="px-2 py-1 text-xs"
                    >
                      <option value="viewer">閲覧者</option>
                      <option value="editor">編集者</option>
                    </Select>
                  )}

                  {/* Remove */}
                  {member.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(member)}
                      className="rounded-full p-1 text-content-tertiary hover:bg-error-light hover:text-error"
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
          <p className="text-sm font-semibold text-content-secondary mb-3">公開リンク</p>
          <div className="space-y-2">
            {[
              { label: "閲覧用（認証不要）", url: viewUrl, type: "view" as const },
              { label: "プレゼンター用", url: presentUrl, type: "present" as const },
            ].map(({ label, url, type }) => (
              <div key={type} className="flex items-center gap-2 rounded-xl border border-border p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-content-secondary">{label}</p>
                  <p className="text-xs text-content-tertiary truncate mt-0.5">{url}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => copyLink(url, type)} className="shrink-0">
                  {copied === type ? "✓ コピー済み" : "コピー"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
