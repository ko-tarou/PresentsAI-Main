package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

const testSecret = "test-secret"

// signToken mints an HS256 token mirroring the API's access-token shape.
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
	mux := http.NewServeMux()
	mux.HandleFunc("/presenter", handlePresenter)
	mux.HandleFunc("/viewer", handleViewer)
	return httptest.NewServer(mux)
}

// TestPresenterRejectsMissingToken: with a secret configured, a presenter
// without a token is refused at the handshake (HTTP 401).
func TestPresenterRejectsMissingToken(t *testing.T) {
	withAuth(t, authConfig{jwtSecret: testSecret})
	srv := authServer()
	defer srv.Close()

	_, resp, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/presenter?session=r1"), nil)
	if err == nil {
		t.Fatal("expected presenter dial without token to fail")
	}
	if resp == nil || resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("want 401, got %v", resp)
	}
}

// TestPresenterRejectsInvalidToken: a token signed with the wrong secret fails.
func TestPresenterRejectsInvalidToken(t *testing.T) {
	withAuth(t, authConfig{jwtSecret: testSecret})
	srv := authServer()
	defer srv.Close()

	bad := signToken(t, "wrong-secret", "user-1")
	_, resp, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/presenter?session=r1&token="+bad), nil)
	if err == nil {
		t.Fatal("expected presenter dial with invalid token to fail")
	}
	if resp == nil || resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("want 401, got %v", resp)
	}
}

// TestPresenterAcceptsValidToken: a properly signed token connects.
func TestPresenterAcceptsValidToken(t *testing.T) {
	withAuth(t, authConfig{jwtSecret: testSecret})
	srv := authServer()
	defer srv.Close()

	good := signToken(t, testSecret, "user-1")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/presenter?session=r1&token="+good), nil)
	if err != nil {
		t.Fatalf("expected presenter dial with valid token to succeed: %v", err)
	}
	conn.Close()
}

// TestViewerAllowsMissingToken: viewers are the public audience path, so no
// token is required even when a secret is configured.
func TestViewerAllowsMissingToken(t *testing.T) {
	withAuth(t, authConfig{jwtSecret: testSecret})
	srv := authServer()
	defer srv.Close()

	conn, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/viewer?session=r1"), nil)
	if err != nil {
		t.Fatalf("expected anonymous viewer dial to succeed: %v", err)
	}
	conn.Close()
}

// TestViewerRejectsInvalidToken: a supplied-but-forged token is refused.
func TestViewerRejectsInvalidToken(t *testing.T) {
	withAuth(t, authConfig{jwtSecret: testSecret})
	srv := authServer()
	defer srv.Close()

	bad := signToken(t, "wrong-secret", "user-1")
	_, resp, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/viewer?session=r1&token="+bad), nil)
	if err == nil {
		t.Fatal("expected viewer dial with invalid token to fail")
	}
	if resp == nil || resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("want 401, got %v", resp)
	}
}

// TestVerificationDisabledWithoutSecret: with no JWT_SECRET, all connections
// (token or not) are allowed — preserving local/dev behaviour.
func TestVerificationDisabledWithoutSecret(t *testing.T) {
	withAuth(t, authConfig{}) // no secret
	srv := authServer()
	defer srv.Close()

	conn, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/presenter?session=r1"), nil)
	if err != nil {
		t.Fatalf("expected presenter dial to succeed with verification disabled: %v", err)
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
		{"", true}, // origin-less (non-browser / same-origin) allowed
	}
	for _, c := range cases {
		r := httptest.NewRequest(http.MethodGet, "/presenter", nil)
		if c.origin != "" {
			r.Header.Set("Origin", c.origin)
		}
		if got := cfg.checkOrigin(r); got != c.want {
			t.Errorf("origin %q: got %v want %v", c.origin, got, c.want)
		}
	}

	// Empty allowlist accepts everything.
	open := authConfig{}
	r := httptest.NewRequest(http.MethodGet, "/presenter", nil)
	r.Header.Set("Origin", "https://anything.example.com")
	if !open.checkOrigin(r) {
		t.Error("empty allowlist should accept any origin")
	}
}
