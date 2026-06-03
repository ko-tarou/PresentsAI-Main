import { vi, describe, it, expect, beforeEach } from "vitest";

const { get, post, put, del } = vi.hoisted(() => ({
  get: vi.fn(() => Promise.resolve({ items: [] })),
  post: vi.fn(() => Promise.resolve({})),
  put: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
}));

vi.mock("./api-client", () => ({
  apiClient: { get, post, put, delete: del },
}));

import { membersApi } from "./members";

const TOKEN = "tok-abc";
const PID = "pres-1";
const auth = { headers: { Authorization: `Bearer ${TOKEN}` } };

describe("membersApi", () => {
  beforeEach(() => {
    get.mockClear();
    post.mockClear();
    put.mockClear();
    del.mockClear();
  });

  it("list calls GET /presentations/:pid/members with auth header", () => {
    membersApi.list(TOKEN, PID);
    expect(get).toHaveBeenCalledWith(`/presentations/${PID}/members`, auth);
  });

  it("invite calls POST with {email, role} body and auth header", () => {
    membersApi.invite(TOKEN, PID, "a@b.com", "editor");
    expect(post).toHaveBeenCalledWith(
      `/presentations/${PID}/members`,
      { email: "a@b.com", role: "editor" },
      auth
    );
  });

  it("updateRole calls PUT /presentations/:pid/members/:userId with {role}", () => {
    membersApi.updateRole(TOKEN, PID, "user-9", "viewer");
    expect(put).toHaveBeenCalledWith(
      `/presentations/${PID}/members/user-9`,
      { role: "viewer" },
      auth
    );
  });

  it("remove calls DELETE /presentations/:pid/members/:userId with auth header", () => {
    membersApi.remove(TOKEN, PID, "user-9");
    expect(del).toHaveBeenCalledWith(`/presentations/${PID}/members/user-9`, auth);
  });
});
