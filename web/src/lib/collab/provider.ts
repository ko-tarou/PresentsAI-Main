import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { Awareness } from "y-protocols/awareness";
import { getSlides, type YSlideMap } from "./schema";

/**
 * Collaboration provider backed by `y-websocket`.
 *
 * One provider == one presentation "room". The Yjs doc is the source of truth
 * (ADR-0011); this class owns connection lifecycle (connect / disconnect /
 * auto-reconnect, handled by y-websocket) and exposes the shared doc, slide
 * array, and the ephemeral awareness channel for live presence. y-websocket
 * encodes awareness updates onto the same socket the collab server relays
 * verbatim, so presence rides the existing transport with no server changes.
 */
export class CollabProvider {
  readonly doc: Y.Doc;
  readonly roomId: string;
  private provider: WebsocketProvider | null = null;

  constructor(roomId: string, doc: Y.Doc = new Y.Doc()) {
    this.roomId = roomId;
    this.doc = doc;
  }

  /** Resolves the collab websocket endpoint (without the room segment). */
  private static endpoint(): string {
    return process.env.NEXT_PUBLIC_COLLAB_URL ?? "ws://localhost:8081";
  }

  /**
   * Opens the websocket connection for this room. y-websocket handles
   * reconnection with exponential backoff internally.
   */
  connect(): void {
    if (this.provider) return;
    this.provider = new WebsocketProvider(
      CollabProvider.endpoint(),
      this.roomId,
      this.doc,
    );
  }

  /** True once the underlying socket has reached the connected state. */
  get connected(): boolean {
    return this.provider?.wsconnected ?? false;
  }

  /** The shared, ordered slide list (Y.Array<Y.Map>). */
  get slides(): Y.Array<YSlideMap> {
    return getSlides(this.doc);
  }

  /**
   * The ephemeral awareness channel (live presence), or null before connect.
   * y-websocket owns the instance; callers wrap it with {@link PresenceManager}.
   */
  get awareness(): Awareness | null {
    return this.provider?.awareness ?? null;
  }

  /** Closes the socket and tears down the provider, keeping the doc intact. */
  disconnect(): void {
    this.provider?.destroy();
    this.provider = null;
  }

  /** Full teardown: disconnect and destroy the underlying Yjs doc. */
  destroy(): void {
    this.disconnect();
    this.doc.destroy();
  }
}
