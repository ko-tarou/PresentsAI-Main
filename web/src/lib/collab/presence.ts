import type { Awareness } from "y-protocols/awareness";

/**
 * Live presence (awareness) layer for collaborative editing.
 *
 * Presence is *ephemeral* (ADR-0011): it is never written into the Yjs doc and
 * never persisted by the collab server, which relays awareness frames verbatim
 * (see `TestAwarenessRelayedNotStored`). Each client publishes who it is, which
 * slide it is on, what object it has selected and (optionally) its cursor, and
 * reads the same back for every other connected client.
 *
 * This module is intentionally framework-free so it can be unit-tested against a
 * bare `Awareness` instance without a websocket.
 */

/** Identity + live position one peer broadcasts about itself. */
export interface PresenceState {
  /** Display name (or anonymous id) shown in the participant list. */
  name: string;
  /** Stable per-session color used for the cursor / selection highlight. */
  color: string;
  /** Id of the slide the peer is currently viewing/editing. */
  slideId: string | null;
  /** Id of the object the peer currently has selected, if any. */
  selectedId: string | null;
  /** Cursor position in slide coordinates, if tracked. */
  cursor: { x: number; y: number } | null;
}

/** A remote peer's presence, tagged with the awareness clientID that owns it. */
export interface RemotePresence extends PresenceState {
  clientId: number;
}

/** Awareness field key under which the whole {@link PresenceState} lives. */
export const PRESENCE_FIELD = "presence";

/** Distinct, accessible palette assigned to peers by clientID. */
const PALETTE = [
  "#2563eb", // blue
  "#db2777", // pink
  "#16a34a", // green
  "#d97706", // amber
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#dc2626", // red
  "#4f46e5", // indigo
];

/** Deterministically pick a palette color for a clientID. */
export function colorForClient(clientId: number): string {
  return PALETTE[Math.abs(clientId) % PALETTE.length];
}

/**
 * Wraps a y-protocols {@link Awareness} instance with typed presence helpers.
 *
 * Owns exactly one awareness field ({@link PRESENCE_FIELD}); it merges partial
 * updates into the existing local state so callers can publish slide / selection
 * / cursor changes independently without clobbering identity.
 */
export class PresenceManager {
  private local: PresenceState;

  constructor(
    private readonly awareness: Awareness,
    identity: { name: string; color?: string },
  ) {
    this.local = {
      name: identity.name,
      color: identity.color ?? colorForClient(awareness.clientID),
      slideId: null,
      selectedId: null,
      cursor: null,
    };
    this.publish();
  }

  /** The awareness clientID that identifies this client's own presence. */
  get clientId(): number {
    return this.awareness.clientID;
  }

  /** This client's currently published presence (read-only snapshot). */
  get localState(): PresenceState {
    return { ...this.local };
  }

  /** Merge a partial update into local presence and broadcast it. */
  update(patch: Partial<Omit<PresenceState, "name" | "color">>): void {
    this.local = { ...this.local, ...patch };
    this.publish();
  }

  private publish(): void {
    this.awareness.setLocalStateField(PRESENCE_FIELD, this.local);
  }

  /** Every *other* peer's presence (the local client is excluded). */
  remoteStates(): RemotePresence[] {
    const out: RemotePresence[] = [];
    for (const [clientId, state] of this.awareness.getStates()) {
      if (clientId === this.awareness.clientID) continue;
      const presence = (state as Record<string, unknown>)[PRESENCE_FIELD] as
        | PresenceState
        | undefined;
      if (presence) out.push({ clientId, ...presence });
    }
    return out;
  }

  /** Subscribe to any awareness change; returns an unsubscribe function. */
  onChange(fn: () => void): () => void {
    this.awareness.on("change", fn);
    return () => this.awareness.off("change", fn);
  }

  /**
   * Clear this client's presence on leave so peers drop it immediately instead
   * of waiting for the 30s awareness timeout. Matches y-websocket's own
   * `beforeunload` cleanup but is also invoked on React unmount.
   */
  destroy(): void {
    this.awareness.setLocalState(null);
  }
}
