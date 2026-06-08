export class PresenterSocket {
  private ws: WebSocket | null = null;
  constructor(sessionId: string) {
    const url = `${process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:8082"}/presenter?session=${sessionId}`;
    this.ws = new WebSocket(url);
  }
  sendSlideChange(index: number) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "slide-change", slideIndex: index }));
    }
  }
  destroy() { this.ws?.close(); }
}

/** Connection lifecycle reported to the viewer UI. */
export type ViewerStatus = "connecting" | "connected" | "disconnected";

export interface ViewerSocketHandlers {
  onSlideChange: (index: number) => void;
  onStatus?: (status: ViewerStatus) => void;
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

export class ViewerSocket {
  private ws: WebSocket | null = null;
  constructor(sessionId: string, handlers: ViewerSocketHandlers | ((index: number) => void)) {
    // Backwards-compatible: a bare callback is treated as onSlideChange.
    const h: ViewerSocketHandlers = typeof handlers === "function" ? { onSlideChange: handlers } : handlers;
    const url = `${process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:8082"}/viewer?session=${sessionId}`;
    h.onStatus?.("connecting");
    this.ws = new WebSocket(url);
    this.ws.onopen = () => h.onStatus?.("connected");
    this.ws.onclose = () => h.onStatus?.("disconnected");
    this.ws.onerror = () => h.onStatus?.("disconnected");
    this.ws.onmessage = (e) => {
      const index = parseSlideChange(e.data);
      if (index !== null) h.onSlideChange(index);
    };
  }
  destroy() {
    // Drop handlers before closing so an unmount-triggered close does not
    // bubble a "disconnected" status into a component that is going away.
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
    }
  }
}
