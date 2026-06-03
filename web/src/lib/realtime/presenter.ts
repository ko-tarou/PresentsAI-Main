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

export class ViewerSocket {
  private ws: WebSocket | null = null;
  constructor(sessionId: string, onSlideChange: (index: number) => void) {
    const url = `${process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:8082"}/viewer?session=${sessionId}`;
    this.ws = new WebSocket(url);
    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { type: string; slideIndex?: number };
        if (msg.type === "slide-change" && msg.slideIndex !== undefined) {
          onSlideChange(msg.slideIndex);
        }
      } catch { /* ignore */ }
    };
  }
  destroy() { this.ws?.close(); }
}
