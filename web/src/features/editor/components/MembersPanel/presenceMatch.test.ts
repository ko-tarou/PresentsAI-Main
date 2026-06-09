import { describe, it, expect } from "vitest";
import type { RemotePresence } from "@lib/collab/presence";
import type { Member } from "@shared/api/members";
import { isMemberOnline, onlineNames } from "./presenceMatch";

function member(over: Partial<Member>): Member {
  return {
    id: "m1",
    presentationId: "p1",
    userId: "u1",
    email: "alice@example.com",
    displayName: "Alice",
    role: "editor",
    createdAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

function peer(name: string): RemotePresence {
  return { clientId: 1, name, color: "#000", slideId: null, selectedId: null, cursor: null };
}

describe("presenceMatch", () => {
  it("matches a member to a peer by display name", () => {
    expect(isMemberOnline(member({ displayName: "Alice" }), [peer("Alice")])).toBe(true);
  });

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    expect(isMemberOnline(member({ displayName: "Alice" }), [peer("  alice ")])).toBe(true);
  });

  it("falls back to the email local part when display name is empty", () => {
    const m = member({ displayName: "", email: "bob@example.com" });
    expect(isMemberOnline(m, [peer("bob")])).toBe(true);
  });

  it("reports offline when no peer matches", () => {
    expect(isMemberOnline(member({ displayName: "Alice" }), [peer("Carol")])).toBe(false);
  });

  it("reports offline with no peers", () => {
    expect(isMemberOnline(member({ displayName: "Alice" }), [])).toBe(false);
  });

  it("onlineNames normalizes every peer name", () => {
    const names = onlineNames([peer(" Alice "), peer("BOB")]);
    expect(names.has("alice")).toBe(true);
    expect(names.has("bob")).toBe(true);
  });
});
