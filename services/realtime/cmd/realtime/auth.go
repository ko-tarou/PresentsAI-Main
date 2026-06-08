package main

import (
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// authConfig captures the WS-connection authorization policy, resolved once at
// startup from the environment. It is shared by realtime and mirrors the API's
// verification method (services/api/.../middleware/auth.go): HMAC-signed JWT,
// `sub` claim required.
type authConfig struct {
	// jwtSecret is the shared HMAC secret. When empty, token verification is
	// DISABLED so local/dev and the existing test suite keep working without a
	// configured secret; production must set JWT_SECRET on every service.
	jwtSecret string
	// allowedOrigins is the CheckOrigin allowlist. When empty, every origin is
	// accepted (dev). When set, only listed origins (and origin-less,
	// non-browser/same-origin requests) connect.
	allowedOrigins []string
}

func loadAuthConfig() authConfig {
	var origins []string
	if raw := os.Getenv("ALLOWED_ORIGINS"); raw != "" {
		for _, o := range strings.Split(raw, ",") {
			if t := strings.TrimSpace(o); t != "" {
				origins = append(origins, t)
			}
		}
	}
	return authConfig{
		jwtSecret:      os.Getenv("JWT_SECRET"),
		allowedOrigins: origins,
	}
}

// checkOrigin enforces the configured allowlist. An empty allowlist accepts
// everything (dev). A missing Origin header (non-browser clients, same-origin)
// is always allowed; browsers always send Origin for cross-origin WS.
func (c authConfig) checkOrigin(r *http.Request) bool {
	if len(c.allowedOrigins) == 0 {
		return true
	}
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	for _, allowed := range c.allowedOrigins {
		if origin == allowed {
			return true
		}
	}
	return false
}

// authError distinguishes "no token supplied" from "token present but invalid"
// so callers can apply path-specific policy (e.g. viewer tolerates the former).
type authError int

const (
	authOK authError = iota
	authMissing
	authInvalid
)

// verifyToken checks the `token` query param against the shared secret. When no
// secret is configured, verification is skipped and authOK is returned (the
// connection is always allowed). The userID (sub claim) is returned on success.
func (c authConfig) verifyToken(r *http.Request) (userID string, result authError) {
	if c.jwtSecret == "" {
		return "", authOK // verification disabled
	}
	raw := r.URL.Query().Get("token")
	if raw == "" {
		return "", authMissing
	}
	token, err := jwt.Parse(raw, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(c.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return "", authInvalid
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", authInvalid
	}
	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return "", authInvalid
	}
	return sub, authOK
}
