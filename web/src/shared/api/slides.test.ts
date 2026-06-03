import { vi, describe, it, expect, beforeEach } from "vitest";

const { get, post, put, patch, del } = vi.hoisted(() => ({
  get: vi.fn(() => Promise.resolve({ items: [] })),
  post: vi.fn(() => Promise.resolve({})),
  put: vi.fn(() => Promise.resolve({})),
  patch: vi.fn(() => Promise.resolve({})),
  del: vi.fn(() => Promise.resolve()),
}));

vi.mock("./api-client", () => ({
  apiClient: { get, post, put, patch, delete: del },
}));

import { slidesApi } from "./slides";

const TOKEN = "tok-s";
const PID = "pres-1";
const auth = { headers: { Authorization: `Bearer ${TOKEN}` } };

describe("slidesApi", () => {
  beforeEach(() => {
    get.mockClear();
    post.mockClear();
    put.mockClear();
    patch.mockClear();
    del.mockClear();
  });

  it("list calls GET /presentations/:pid/slides", () => {
    slidesApi.list(TOKEN, PID);
    expect(get).toHaveBeenCalledWith(`/presentations/${PID}/slides`, auth);
  });

  it("get calls GET /presentations/:pid/slides/:slideId", () => {
    slidesApi.get(TOKEN, PID, "s-1");
    expect(get).toHaveBeenCalledWith(`/presentations/${PID}/slides/s-1`, auth);
  });

  it("create calls POST /presentations/:pid/slides with empty body", () => {
    slidesApi.create(TOKEN, PID);
    expect(post).toHaveBeenCalledWith(`/presentations/${PID}/slides`, {}, auth);
  });

  it("updateContent calls PUT /presentations/:pid/slides/:slideId with {content}", () => {
    const content = { version: "6.0.0", objects: [], background: "#fff" };
    slidesApi.updateContent(TOKEN, PID, "s-1", content);
    expect(put).toHaveBeenCalledWith(
      `/presentations/${PID}/slides/s-1`,
      { content },
      auth
    );
  });

  it("delete calls DELETE /presentations/:pid/slides/:slideId", () => {
    slidesApi.delete(TOKEN, PID, "s-1");
    expect(del).toHaveBeenCalledWith(`/presentations/${PID}/slides/s-1`, auth);
  });

  it("reorder calls PUT /presentations/:pid/slides/reorder with {positions}", () => {
    const positions = { "s-1": 0, "s-2": 1 };
    slidesApi.reorder(TOKEN, PID, positions);
    expect(put).toHaveBeenCalledWith(
      `/presentations/${PID}/slides/reorder`,
      { positions },
      auth
    );
  });

  it("updateNotes calls PATCH /presentations/:pid/slides/:slideId/notes with {notes}", () => {
    slidesApi.updateNotes(TOKEN, PID, "s-1", "hello");
    expect(patch).toHaveBeenCalledWith(
      `/presentations/${PID}/slides/s-1/notes`,
      { notes: "hello" },
      auth
    );
  });
});
