import type { RemotePresence } from "@lib/collab/presence";
import type { Member } from "@shared/api/members";

/**
 * Online matching between roster members and live presence peers.
 *
 * Presence is ephemeral and identifies peers only by a display name (ADR-0011);
 * the roster is keyed by user id / email. We therefore bridge the two by name:
 * a member counts as online when some connected peer broadcasts a name equal to
 * the member's display name (or, lacking one, the local part of their email).
 * Matching is case-insensitive and trims surrounding whitespace so cosmetic
 * differences don't read as "offline".
 */
function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** The name a member is expected to broadcast as a presence peer. */
function memberPresenceName(member: Member): string {
  if (member.displayName.trim()) return member.displayName;
  return member.email.split("@")[0] ?? member.email;
}

/** Set of normalized names currently present (one per connected peer). */
export function onlineNames(peers: RemotePresence[]): Set<string> {
  return new Set(peers.map((p) => normalize(p.name)));
}

/** Whether a roster member matches any connected presence peer. */
export function isMemberOnline(member: Member, peers: RemotePresence[]): boolean {
  return onlineNames(peers).has(normalize(memberPresenceName(member)));
}
