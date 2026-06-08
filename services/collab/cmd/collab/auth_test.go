package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"

	"github.com/ko-tarou/presentsai/services/collab/internal/hub"
)

const testSecret = "test-secret"

func signToken(t *testing.T, secret, sub string) string {
	t.Helper()
	tok, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": sub,
		"exp": time.Now().Add(time.Hour).Unix(),
	}).SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	return tok
}

// withAuth swaps the global auth config for a test and restores it after.
func withAuth(t *testing.T, cfg authConfig) {
	t.Helper()
	prev := auth
	auth = cfg
	t.Cleanup(func() { auth = prev })
}

func authServer() *httptest.Server {
	return httptest.NewServer(makeHandler(hub.New(nil)))
}

func wsURL(base, pathQuery string) string {
	return "ws" + base[len("http"):] + pathQuery
}

// TestRejectsMissingToken: with a secret configured, a connection without a
// token is refused at the handshake (HTTP 401).
func TestRejectsMissingToken(t *testing.T) {
	withAuth(t, authConfig{jwtSecret: testSecret})
	srv := authServer()
	defer srv.Close()

	_, resp, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/deck"), nil)
	if err == nil {
		t.Fatal("expected dial without token to fail")
	}
	if resp == nil || resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("want 401, got %v", resp)
	}
}

// TestRejectsInvalidToken: a token signed with the wrong secret fails.
func TestRejectsInvalidToken(t *testing.T) {
	withAuth(t, authConfig{jwtSecret: testSecret})
	srv := authServer()
	defer srv.Close()

	bad := signToken(t, "wrong-secret", "user-1")
	_, resp, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/deck?token="+bad), nil)
	if err == nil {
		t.Fatal("expected dial with invalid token to fail")
	}
	if resp == nil || resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("want 401, got %v", resp)
	}
}

// TestAcceptsValidToken: a properly signed token connects.
func TestAcceptsValidToken(t *testing.T) {
	withAuth(t, authConfig{jwtSecret: testSecret})
	srv := authServer()
	defer srv.Close()

	good := signToken(t, testSecret, "user-1")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/deck?token="+good), nil)
	if err != nil {
		t.Fatalf("expected dial with valid token to succeed: %v", err)
	}
	conn.Close()
}

// TestVerificationDisabledWithoutSecret: with no JWT_SECRET, connections are
// allowed without a token — preserving local/dev behaviour.
func TestVerificationDisabledWithoutSecret(t *testing.T) {
	withAuth(t, authConfig{})
	srv := authServer()
	defer srv.Close()

	conn, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/deck"), nil)
	if err != nil {
		t.Fatalf("expected dial to succeed with verification disabled: %v", err)
	}
	conn.Close()
}

// TestCheckOriginAllowlist exercises the origin policy directly.
func TestCheckOriginAllowlist(t *testing.T) {
	cfg := authConfig{allowedOrigins: []string{"https://app.example.com"}}
	cases := []struct {
		origin string
		want   bool
	}{
		{"https://app.example.com", true},
		{"https://evil.example.com", false},
		{"", true},
	}
	for _, c := range cases {
		r := httptest.NewRequest(http.MethodGet, "/deck", nil)
		if c.origin != "" {
			r.Header.Set("Origin", c.origin)
		}
		if got := cfg.checkOrigin(r); got != c.want {
			t.Errorf("origin %q: got %v want %v", c.origin, got, c.want)
		}
	}
}
