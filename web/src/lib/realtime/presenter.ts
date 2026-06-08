/** Connection lifecycle reported to the UI. */
export type ViewerStatus = "connecting" | "connected" | "disconnected";

export interface ViewerSocketHandlers {
  onSlideChange: (index: number) => void;
  onStatus?: (status: ViewerStatus) => void;
}

/**
 * Exponential-backoff schedule for realtime reconnects: 500ms, 1s, 2s, 4s,
 * capped at 10s, with up to 30% jitter so a fleet of viewers reconnecting after
 * a server blip does not stampede. Pure + injectable so it is unit-testable.
 */
export function backoffDelay(attempt: number, rand: () => number = Math.random): number {
  const base = Math.min(500 * 2 ** attempt, 10_000);
  return Math.round(base * (1 + rand() * 0.3));
}

function realtimeBase(): string {
  return process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:8082";
}

/**
 * Append the access token as a `?token=` query param when present. WebSocket
 * handshakes from the browser cannot carry an Authorization header, so the
 * realtime/collab services read the token from the query string (matching the
 * API's JWT verification). A null/empty token leaves the URL untouched — the
 * viewer (public audience) path connects anonymously.
 */
export function withToken(url: string, token?: string | null): string {
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

/**
 * Parse a raw realtime message and return the slide index the viewer should
 * follow, or null if the message is not a usable slide-change. Pure so the
 * follow logic can be unit-tested without a live socket.
 */
export function parseSlideChange(data: unknown): number | null {
  if (typeof data !== "string") return null;
  try {
    const msg = JSON.parse(data) as { type?: string; slideIndex?: number };
    if (msg.type === "slide-change" && typeof msg.slideIndex === "number" && Number.isFinite(msg.slideIndex)) {
      return msg.slideIndex;
    }
  } catch {
    /* ignore malformed frames */
  }
  return null;
}

/**
 * A WebSocket that transparently reconnects with exponential backoff until
 * {@link ReconnectingSocket.destroy} is called. Subclasses supply the URL and
 * react to open/message/status via the protected hooks. Keeps the socket
 * lifecycle (and the "is this close intentional?" bookkeeping) in one place so
 * both presenter and viewer get identical, tested reconnect behaviour.
 */
class ReconnectingSocket {
  protected ws: WebSocket | null = null;
  private attempt = 0;
  private closedByUs = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly url: string,
    private readonly rand: () => number = Math.random,
  ) {}

  /** Must be called by subclasses once their fields are initialised. */
  protected start() {
    this.connect();
  }

  private connect() {
    this.onStatus("connecting");
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.attempt = 0;
      this.onStatus("connected");
      this.onOpen();
    };
    ws.onmessage = (e) => this.onMessage(e.data);
    ws.onclose = () => this.handleDrop();
    ws.onerror = () => this.handleDrop();
  }

  private handleDrop() {
    if (this.closedByUs) return;
    // Detach so a duplicate close/error from the same dead socket cannot trigger
    // a second reconnect schedule.
    if (this.ws) {
      this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null;
    }
    this.onStatus("disconnected");
    const delay = backoffDelay(this.attempt++, this.rand);
    this.timer = setTimeout(() => this.connect(), delay);
  }

  /** Stop reconnecting and tear down the current socket. Idempotent. */
  destroy() {
    this.closedByUs = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ws) {
      this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }

  // --- hooks ---
  protected onOpen(): void {}
  protected onMessage(_data: unknown): void {}
  protected onStatus(_status: ViewerStatus): void {}
}

/**
 * Presenter side of the realtime channel. Auto-reconnects with backoff and, on
 * every (re)connect, re-sends the current slide so the server's late-join
 * snapshot stays accurate even across a server restart or presenter reconnect.
 */
export class PresenterSocket extends ReconnectingSocket {
  private lastIndex = 0;

  constructor(sessionId: string, token?: string | null, rand: () => number = Math.random) {
    super(withToken(`${realtimeBase()}/presenter?session=${sessionId}`, token), rand);
    this.start();
  }

  protected onOpen(): void {
    // Re-publish current position so a freshly (re)connected server snapshots it.
    this.transmit(this.lastIndex);
  }

  sendSlideChange(index: number) {
    this.lastIndex = index;
    this.transmit(index);
  }

  private transmit(index: number) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "slide-change", slideIndex: index }));
    }
  }
}

/**
 * Viewer side of the realtime channel. Auto-reconnects with backoff; on each
 * (re)connect the server immediately sends the current slide snapshot, so a
 * late joiner or a viewer recovering from a drop lands on the right slide.
 */
export class ViewerSocket extends ReconnectingSocket {
  private readonly handlers: ViewerSocketHandlers;

  constructor(
    sessionId: string,
    handlers: ViewerSocketHandlers | ((index: number) => void),
    rand: () => number = Math.random,
    token?: string | null,
  ) {
    super(withToken(`${realtimeBase()}/viewer?session=${sessionId}`, token), rand);
    // Backwards-compatible: a bare callback is treated as onSlideChange.
    this.handlers = typeof handlers === "function" ? { onSlideChange: handlers } : handlers;
    this.start();
  }

  protected onMessage(data: unknown): void {
    const index = parseSlideChange(data);
    if (index !== null) this.handlers.onSlideChange(index);
  }

  protected onStatus(status: ViewerStatus): void {
    this.handlers.onStatus?.(status);
  }
}
