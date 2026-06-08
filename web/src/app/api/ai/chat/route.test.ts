import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
}

describe("POST /api/ai/chat", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("proxies to the gateway with stream:true and the configured model", async () => {
    fetchMock.mockResolvedValue(
      new Response(sseStream(["data: [DONE]\n\n"]), { status: 200 }),
    );

    await POST(makeReq({ messages: [{ role: "user", content: "hi" }] }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/v1/chat/completions");
    const sent = JSON.parse(init.body);
    expect(sent.stream).toBe(true);
    expect(sent.model).toBe("lfm2-2.6b-f16");
    expect(sent.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("passes the gateway SSE stream through to the client", async () => {
    const payload = 'data: {"choices":[{"delta":{"content":"hello"}}]}\n\ndata: [DONE]\n\n';
    fetchMock.mockResolvedValue(
      new Response(sseStream([payload]), { status: 200 }),
    );

    const res = await POST(makeReq({ messages: [{ role: "user", content: "x" }] }));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toBe(payload);
  });

  it("forwards response_format when provided", async () => {
    fetchMock.mockResolvedValue(
      new Response(sseStream(["data: [DONE]\n\n"]), { status: 200 }),
    );

    await POST(
      makeReq({
        messages: [{ role: "user", content: "x" }],
        response_format: { type: "json_object" },
      }),
    );

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.response_format).toEqual({ type: "json_object" });
  });

  it("returns 400 when messages are missing", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 502 when the gateway fails", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    const res = await POST(
      makeReq({ messages: [{ role: "user", content: "x" }] }),
    );
    expect(res.status).toBe(502);
  });
});
