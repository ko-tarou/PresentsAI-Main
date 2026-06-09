"use client";
import { useCallback, useEffect, useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { membersApi, type Member, type MemberRole } from "@shared/api/members";
import type { RemotePresence } from "@lib/collab/presence";
import { isMemberOnline } from "./presenceMatch";

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
    <aside className="flex w-64 shrink-0 flex-col border-l bg-white">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-xs font-semibold text-gray-600">メンバー ({members.length})</p>
        {loading ? (
          <span className="text-xs text-gray-400">読み込み中...</span>
        ) : (
          <span className="text-[10px] text-gray-400">{onlineCount} 人がオンライン</span>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {members.length === 0 && !loading ? (
          <p className="text-xs text-gray-400">まだ共有されていません。</p>
        ) : (
          members.map((member) => {
            const online = isMemberOnline(member, peers);
            return (
              <div
                key={member.userId}
                className="flex items-center gap-2 rounded-lg border bg-gray-50 p-2"
              >
                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {(member.displayName || member.email).charAt(0).toUpperCase()}
                  </div>
                  <span
                    aria-label={online ? "オンライン" : "オフライン"}
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      online ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                </div>

                {/* Name / email */}
                <div className="min-w-0 flex-1">
                  {member.displayName && (
                    <p className="truncate text-xs font-medium text-gray-800">
                      {member.displayName}
                    </p>
                  )}
                  <p className="truncate text-[10px] text-gray-500">{member.email}</p>
                </div>

                {/* Role */}
                {member.role === "owner" ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_BADGE[member.role]}`}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>
                ) : (
                  <select
                    aria-label={`${member.displayName || member.email} の役割`}
                    value={member.role}
                    onChange={(e) => changeRole(member, e.target.value as MemberRole)}
                    className="shrink-0 rounded border px-1 py-0.5 text-[10px] text-gray-700 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="viewer">閲覧者</option>
                    <option value="editor">編集者</option>
                  </select>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
