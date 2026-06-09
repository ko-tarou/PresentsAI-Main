import { Badge } from "./Badge";

export type Role = "owner" | "editor" | "viewer";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "オーナー",
  editor: "編集者",
  viewer: "閲覧者",
};

const ROLE_VARIANT = {
  owner: "primary",
  editor: "info",
  viewer: "default",
} as const;

/**
 * Canonical role pill shared by the dashboard ShareModal and the editor
 * MembersPanel, so collaborator roles look identical everywhere. Maps each
 * role onto a token-based {@link Badge} variant.
 */
export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <Badge variant={ROLE_VARIANT[role]} className={className}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}
