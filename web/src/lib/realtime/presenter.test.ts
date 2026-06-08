import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseSlideChange, ViewerSocket, type ViewerStatus } from "./presenter";

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

// Minimal WebSocket stand-in so we can drive lifecycle + messages without a server.
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  readyState = 0;
  closed = false;
  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  close() { this.closed = true; }
}

describe("ViewerSocket", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
  });

  it("reports connecting immediately, then connected on open", () => {
    const statuses: ViewerStatus[] = [];
    new ViewerSocket("sess-1", { onSlideChange: () => {}, onStatus: (s) => statuses.push(s) });
    const ws = FakeWebSocket.instances[0];
    expect(ws.url).toContain("/viewer?session=sess-1");
    expect(statuses).toEqual(["connecting"]);
    ws.onopen?.();
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

  it("reports disconnected on close and error", () => {
    const statuses: ViewerStatus[] = [];
    new ViewerSocket("s", { onSlideChange: () => {}, onStatus: (st) => statuses.push(st) });
    const ws = FakeWebSocket.instances[0];
    ws.onclose?.();
    ws.onerror?.();
    expect(statuses).toEqual(["connecting", "disconnected", "disconnected"]);
  });

  it("detaches handlers and closes the socket on destroy", () => {
    const statuses: ViewerStatus[] = [];
    const sock = new ViewerSocket("s", { onSlideChange: () => {}, onStatus: (st) => statuses.push(st) });
    const ws = FakeWebSocket.instances[0];
    sock.destroy();
    expect(ws.closed).toBe(true);
    expect(ws.onclose).toBeNull();
    expect(ws.onmessage).toBeNull();
    // a stray close after destroy must not push another status update
    expect(statuses).toEqual(["connecting"]);
  });
});
