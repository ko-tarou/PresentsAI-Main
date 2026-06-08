import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseSlideChange, backoffDelay, withToken, ViewerSocket, PresenterSocket, type ViewerStatus } from "./presenter";

describe("withToken", () => {
  it("appends the token as a query param, preserving existing query", () => {
    expect(withToken("ws://h/presenter?session=s", "abc")).toBe("ws://h/presenter?session=s&token=abc");
    expect(withToken("ws://h/room", "abc")).toBe("ws://h/room?token=abc");
  });
  it("url-encodes the token", () => {
    expect(withToken("ws://h/x", "a b/c")).toBe("ws://h/x?token=a%20b%2Fc");
  });
  it("leaves the URL untouched when no token is supplied", () => {
    expect(withToken("ws://h/x?session=s")).toBe("ws://h/x?session=s");
    expect(withToken("ws://h/x?session=s", null)).toBe("ws://h/x?session=s");
    expect(withToken("ws://h/x?session=s", "")).toBe("ws://h/x?session=s");
  });
});

describe("parseSlideChange", () => {
  it("returns the index for a well-formed slide-change frame", () => {
    expect(parseSlideChange(JSON.stringify({ type: "slide-change", slideIndex: 3 }))).toBe(3);
    expect(parseSlideChange(JSON.stringify({ type: "slide-change", slideIndex: 0 }))).toBe(0);
  });

  it("rejects unrelated, malformed, or non-string frames", () => {
    expect(parseSlideChange(JSON.stringify({ type: "ping" }))).toBeNull();
    expect(parseSlideChange(JSON.stringify({ type: "slide-change" }))).toBeNull();
    expect(parseSlideChange(JSON.stringify({ type: "slide-change", slideIndex: "2" }))).toBeNull();
    expect(parseSlideChange("not json")).toBeNull();
    expect(parseSlideChange(42)).toBeNull();
    expect(parseSlideChange(null)).toBeNull();
  });
});

describe("backoffDelay", () => {
  it("grows exponentially from 500ms and caps at 10s (no jitter)", () => {
    const noJitter = () => 0;
    expect(backoffDelay(0, noJitter)).toBe(500);
    expect(backoffDelay(1, noJitter)).toBe(1000);
    expect(backoffDelay(2, noJitter)).toBe(2000);
    expect(backoffDelay(3, noJitter)).toBe(4000);
    expect(backoffDelay(10, noJitter)).toBe(10_000); // capped
  });

  it("adds up to 30% jitter", () => {
    expect(backoffDelay(0, () => 1)).toBe(650); // 500 * 1.3
    expect(backoffDelay(1, () => 1)).toBe(1300); // 1000 * 1.3
  });
});

// Minimal WebSocket stand-in so we can drive lifecycle + messages without a server.
class FakeWebSocket {
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  readyState = 0;
  closed = false;
  sent: string[] = [];
  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  send(data: string) { this.sent.push(data); }
  close() { this.closed = true; }
  open() { this.readyState = FakeWebSocket.OPEN; this.onopen?.(); }
}

describe("ViewerSocket", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reports connecting immediately, then connected on open", () => {
    const statuses: ViewerStatus[] = [];
    new ViewerSocket("sess-1", { onSlideChange: () => {}, onStatus: (s) => statuses.push(s) });
    const ws = FakeWebSocket.instances[0];
    expect(ws.url).toContain("/viewer?session=sess-1");
    expect(statuses).toEqual(["connecting"]);
    ws.open();
    expect(statuses).toEqual(["connecting", "connected"]);
  });

  it("invokes onSlideChange for slide-change frames and ignores others", () => {
    const seen: number[] = [];
    new ViewerSocket("s", { onSlideChange: (i) => seen.push(i) });
    const ws = FakeWebSocket.instances[0];
    ws.onmessage?.({ data: JSON.stringify({ type: "slide-change", slideIndex: 5 }) });
    ws.onmessage?.({ data: JSON.stringify({ type: "noise" }) });
    ws.onmessage?.({ data: "garbage" });
    expect(seen).toEqual([5]);
  });

  it("reconnects with backoff after an unexpected close, reporting disconnected then connecting", () => {
    const statuses: ViewerStatus[] = [];
    new ViewerSocket("s", { onSlideChange: () => {}, onStatus: (st) => statuses.push(st) }, () => 0);
    const ws = FakeWebSocket.instances[0];
    ws.open();
    expect(statuses).toEqual(["connecting", "connected"]);

    ws.onclose?.(); // server drop
    expect(statuses).toEqual(["connecting", "connected", "disconnected"]);
    expect(FakeWebSocket.instances).toHaveLength(1); // not yet reconnected

    vi.advanceTimersByTime(500); // first backoff step
    expect(FakeWebSocket.instances).toHaveLength(2); // reconnect attempted
    expect(statuses).toEqual(["connecting", "connected", "disconnected", "connecting"]);
  });

  it("backs off progressively across repeated drops", () => {
    new ViewerSocket("s", { onSlideChange: () => {} }, () => 0);
    FakeWebSocket.instances[0].onclose?.();
    vi.advanceTimersByTime(499);
    expect(FakeWebSocket.instances).toHaveLength(1); // not reconnected before 500ms
    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(2);

    FakeWebSocket.instances[1].onclose?.();
    vi.advanceTimersByTime(999);
    expect(FakeWebSocket.instances).toHaveLength(2); // 2nd attempt waits 1000ms
    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(3);
  });

  it("a duplicate close/error from the same dead socket schedules only one reconnect", () => {
    new ViewerSocket("s", { onSlideChange: () => {} }, () => 0);
    const ws = FakeWebSocket.instances[0];
    ws.onclose?.();
    ws.onerror?.(); // handlers were detached, so this is a no-op
    vi.advanceTimersByTime(500);
    expect(FakeWebSocket.instances).toHaveLength(2); // exactly one reconnect
  });

  it("stops reconnecting and closes the socket on destroy", () => {
    const statuses: ViewerStatus[] = [];
    const sock = new ViewerSocket("s", { onSlideChange: () => {}, onStatus: (st) => statuses.push(st) }, () => 0);
    const ws = FakeWebSocket.instances[0];
    sock.destroy();
    expect(ws.closed).toBe(true);
    expect(ws.onclose).toBeNull();
    expect(ws.onmessage).toBeNull();
    vi.advanceTimersByTime(60_000);
    expect(FakeWebSocket.instances).toHaveLength(1); // no reconnect after destroy
    expect(statuses).toEqual(["connecting"]);
  });
});

describe("PresenterSocket", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("includes the access token in the connection URL when supplied", () => {
    new PresenterSocket("s", "tok-123");
    expect(FakeWebSocket.instances[0].url).toContain("/presenter?session=s&token=tok-123");
  });

  it("omits the token query when none is supplied", () => {
    new PresenterSocket("s");
    expect(FakeWebSocket.instances[0].url).toBe("ws://localhost:8082/presenter?session=s");
  });

  it("sends slide-change frames once open", () => {
    const sock = new PresenterSocket("s");
    const ws = FakeWebSocket.instances[0];
    ws.open();
    sock.sendSlideChange(3);
    expect(ws.sent).toContain(JSON.stringify({ type: "slide-change", slideIndex: 3 }));
  });

  it("re-publishes the current slide on reconnect so the server snapshot stays accurate", () => {
    const sock = new PresenterSocket("s", null, () => 0);
    const ws1 = FakeWebSocket.instances[0];
    ws1.open();
    sock.sendSlideChange(7);

    ws1.onclose?.(); // drop
    vi.advanceTimersByTime(500); // reconnect
    const ws2 = FakeWebSocket.instances[1];
    ws2.open();
    // On reconnect, the presenter re-sends slide 7 (its remembered position).
    expect(ws2.sent).toContain(JSON.stringify({ type: "slide-change", slideIndex: 7 }));
  });
});
