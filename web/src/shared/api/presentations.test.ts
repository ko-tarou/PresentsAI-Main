import { vi, describe, it, expect, beforeEach } from "vitest";

const { get, post, put, del } = vi.hoisted(() => ({
  get: vi.fn(() => Promise.resolve({ items: [], total: 0 })),
  post: vi.fn(() => Promise.resolve({})),
  put: vi.fn(() => Promise.resolve({})),
  del: vi.fn(() => Promise.resolve()),
}));

vi.mock("./api-client", () => ({
  apiClient: { get, post, put, delete: del },
}));

import { presentationsApi } from "./presentations";

const TOKEN = "tok-xyz";
const auth = { headers: { Authorization: `Bearer ${TOKEN}` } };

describe("presentationsApi", () => {
  beforeEach(() => {
    get.mockClear();
    post.mockClear();
    put.mockClear();
    del.mockClear();
  });

  it("list calls GET /presentations with auth header", () => {
    presentationsApi.list(TOKEN);
    expect(get).toHaveBeenCalledWith("/presentations", auth);
  });

  it("create calls POST /presentations with {title}", () => {
    presentationsApi.create(TOKEN, "My Deck");
    expect(post).toHaveBeenCalledWith("/presentations", { title: "My Deck" }, auth);
  });

  it("get calls GET /presentations/:id", () => {
    presentationsApi.get(TOKEN, "p-1");
    expect(get).toHaveBeenCalledWith("/presentations/p-1", auth);
  });

  it("update calls PUT /presentations/:id with {title}", () => {
    presentationsApi.update(TOKEN, "p-1", "Renamed");
    expect(put).toHaveBeenCalledWith("/presentations/p-1", { title: "Renamed" }, auth);
  });

  it("delete calls DELETE /presentations/:id", () => {
    presentationsApi.delete(TOKEN, "p-1");
    expect(del).toHaveBeenCalledWith("/presentations/p-1", auth);
  });
});
