"use client";
import { useCallback, useEffect, useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { membersApi, type Member, type MemberRole } from "@shared/api/members";
import { Avatar, RoleBadge, Select } from "@shared/components/ui";
import type { RemotePresence } from "@lib/collab/presence";
import { isMemberOnline } from "./presenceMatch";

/**
 * In-editor roster: lists collaborators with their role (editable for
 * non-owners) and a live online/offline dot derived from the presence peers.
 * Mirrors the side-panel shape of {@link CommentsPanel}; role changes go
 * through the same `membersApi` the dashboard ShareModal uses (JWT via
 * `apiClient`). Read-only viewing of the roster degrades gracefully when the
 * presentation has not been shared yet (empty list).
 */
export function MembersPanel({ peers }: { peers: RemotePresence[] }) {
  const presentationId = useEditorStore((s) => s.presentationId);
  const { accessToken } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !presentationId) return;
    setLoading(true);
    try {
      const res = await membersApi.list(accessToken, presentationId);
      setMembers(res.items ?? []);
    } catch {
      /* not yet shared — an empty roster is fine */
    } finally {
      setLoading(false);
    }
  }, [accessToken, presentationId]);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = useCallback(
    async (member: Member, role: MemberRole) => {
      if (!accessToken || !presentationId || role === "owner") return;
      const prev = member.role;
      // Optimistic: reflect immediately, roll back if the request fails.
      setMembers((ms) => ms.map((m) => (m.userId === member.userId ? { ...m, role } : m)));
      try {
        await membersApi.updateRole(accessToken, presentationId, member.userId, role);
      } catch {
        setMembers((ms) =>
          ms.map((m) => (m.userId === member.userId ? { ...m, role: prev } : m)),
        );
      }
    },
    [accessToken, presentationId],
  );

  const onlineCount = members.filter((m) => isMemberOnline(m, peers)).length;

  return (
    <aside className="side-panel w-64">
      <div className="side-panel-header">
        <p className="side-panel-title">メンバー ({members.length})</p>
        {loading ? (
          <span className="text-xs text-content-tertiary">読み込み中...</span>
        ) : (
          <span className="text-[10px] text-content-tertiary">{onlineCount} 人がオンライン</span>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {members.length === 0 && !loading ? (
          <p className="text-xs text-content-tertiary">まだ共有されていません。</p>
        ) : (
          members.map((member) => {
            const online = isMemberOnline(member, peers);
            return (
              <div
                key={member.userId}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-subtle p-2"
              >
                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                  <Avatar name={member.displayName || member.email} size="sm" />
                  <span
                    aria-label={online ? "オンライン" : "オフライン"}
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${
                      online ? "bg-success" : "bg-content-tertiary"
                    }`}
                  />
                </div>

                {/* Name / email */}
                <div className="min-w-0 flex-1">
                  {member.displayName && (
                    <p className="truncate text-xs font-medium text-content-primary">
                      {member.displayName}
                    </p>
                  )}
                  <p className="truncate text-[10px] text-content-secondary">{member.email}</p>
                </div>

                {/* Role */}
                {member.role === "owner" ? (
                  <RoleBadge role={member.role} className="shrink-0" />
                ) : (
                  <Select
                    aria-label={`${member.displayName || member.email} の役割`}
                    value={member.role}
                    onChange={(e) => changeRole(member, e.target.value as MemberRole)}
                    className="shrink-0 px-1.5 py-0.5 text-[10px]"
                  >
                    <option value="viewer">閲覧者</option>
                    <option value="editor">編集者</option>
                  </Select>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
