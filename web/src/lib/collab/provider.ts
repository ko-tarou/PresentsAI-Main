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
  // Access token for WS authorization. Forwarded to the collab server as a
  // `token` query param (browsers cannot set WS Authorization headers), where
  // it is verified against the shared JWT secret. null when unauthenticated.
  private readonly token: string | null;

  constructor(roomId: string, doc: Y.Doc = new Y.Doc(), token: string | null = null) {
    this.roomId = roomId;
    this.doc = doc;
    this.token = token;
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
    // y-websocket serializes `params` onto the handshake URL query string, so
    // the token rides the same socket the relay already verifies.
    const params = this.token ? { token: this.token } : undefined;
    this.provider = new WebsocketProvider(
      CollabProvider.endpoint(),
      this.roomId,
      this.doc,
      { params },
    );
  }

  /** True once the underlying socket has reached the connected state. */
  get connected(): boolean {
    return this.provider?.wsconnected ?? false;
  }

  /** True once the initial state sync with the server has completed. */
  get synced(): boolean {
    return this.provider?.synced ?? false;
  }

  /**
   * Resolves once this room's initial sync with the server has completed (or
   * immediately if it already has). Callers that seed an empty room must await
   * this first: seeding before the server's persisted slides have arrived would
   * duplicate every slide once the remote update merges in, because a Y.Array
   * does not dedupe by slide id (#132). If the provider is gone (disconnected /
   * destroyed) the promise never resolves; callers gate seeding behind it, so a
   * torn-down room simply never seeds, which is the safe outcome.
   */
  whenSynced(): Promise<void> {
    const provider = this.provider;
    if (!provider) return new Promise<void>(() => {});
    if (provider.synced) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const onSync = (isSynced: boolean) => {
        if (!isSynced) return;
        provider.off("sync", onSync);
        resolve();
      };
      provider.on("sync", onSync);
    });
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
