import { vi, describe, it, expect, beforeEach } from "vitest";
import type { SlideContent } from "@shared/types/slide";

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(() => Promise.resolve({ items: [] })),
  post: vi.fn(() => Promise.resolve({})),
}));

vi.mock("./api-client", () => ({
  apiClient: { get, post },
}));

import { versionsApi } from "./versions";

const TOKEN = "tok-abc";
const PID = "pres-1";
const SID = "slide-9";
const VID = "ver-3";
const auth = { headers: { Authorization: `Bearer ${TOKEN}` } };
const content: SlideContent = { version: "6.0.0", objects: [], background: "#fff" };

describe("versionsApi", () => {
  beforeEach(() => {
    get.mockClear();
    post.mockClear();
  });

  it("list calls GET /presentations/:pid/slides/:sid/versions with auth header", () => {
    versionsApi.list(TOKEN, PID, SID);
    expect(get).toHaveBeenCalledWith(
      `/presentations/${PID}/slides/${SID}/versions`,
      auth
    );
  });

  it("create posts {content} to the slide versions endpoint", () => {
    versionsApi.create(TOKEN, PID, SID, content);
    expect(post).toHaveBeenCalledWith(
      `/presentations/${PID}/slides/${SID}/versions`,
      { content },
      auth
    );
  });

  it("restore posts an empty body to the restore endpoint", () => {
    versionsApi.restore(TOKEN, PID, SID, VID);
    expect(post).toHaveBeenCalledWith(
      `/presentations/${PID}/slides/${SID}/versions/${VID}/restore`,
      {},
      auth
    );
  });
});
