import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      userId: null,
    });
  });

  it("setTokens parses the JWT sub claim into userId", () => {
    const access = makeJwt({ sub: "user-123" });
    useAuthStore.getState().setTokens(access, "refresh-1");
    const state = useAuthStore.getState();
    expect(state.userId).toBe("user-123");
    expect(state.accessToken).toBe(access);
    expect(state.refreshToken).toBe("refresh-1");
  });

  it("setTokens with a malformed access token does not throw and sets userId to null", () => {
    expect(() =>
      useAuthStore.getState().setTokens("not-a-jwt", "refresh-2")
    ).not.toThrow();
    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.accessToken).toBe("not-a-jwt");
    expect(state.refreshToken).toBe("refresh-2");
  });

  it("clearTokens resets accessToken, refreshToken, and userId to null", () => {
    useAuthStore.getState().setTokens(makeJwt({ sub: "user-9" }), "refresh-9");
    useAuthStore.getState().clearTokens();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.userId).toBeNull();
  });
});
