import { vi, describe, it, expect, beforeEach } from "vitest";

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(() => Promise.resolve({ items: [] })),
  post: vi.fn(() => Promise.resolve({})),
}));

vi.mock("./api-client", () => ({
  apiClient: { get, post },
}));

import { commentsApi } from "./comments";

const TOKEN = "tok-abc";
const PID = "pres-1";
const auth = { headers: { Authorization: `Bearer ${TOKEN}` } };

describe("commentsApi", () => {
  beforeEach(() => {
    get.mockClear();
    post.mockClear();
  });

  it("list calls GET /presentations/:pid/comments with auth header", () => {
    commentsApi.list(TOKEN, PID);
    expect(get).toHaveBeenCalledWith(`/presentations/${PID}/comments`, auth);
  });

  it("create calls POST with {body} and auth header", () => {
    commentsApi.create(TOKEN, PID, { body: "hello" });
    expect(post).toHaveBeenCalledWith(
      `/presentations/${PID}/comments`,
      { body: "hello" },
      auth
    );
  });

  it("create forwards an optional slideId in the body", () => {
    commentsApi.create(TOKEN, PID, { body: "hi", slideId: "slide-9" });
    expect(post).toHaveBeenCalledWith(
      `/presentations/${PID}/comments`,
      { body: "hi", slideId: "slide-9" },
      auth
    );
  });
});
