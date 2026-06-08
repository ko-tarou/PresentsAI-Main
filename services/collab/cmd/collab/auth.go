package main

import (
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// authConfig captures the WS-connection authorization policy, resolved once at
// startup. It mirrors the API's verification method
// (services/api/.../middleware/auth.go): HMAC-signed JWT, `sub` claim required.
//
// Collaborative editing is an authenticated-only feature, so — unlike the
// realtime audience path — collab requires a valid token whenever a secret is
// configured. y-websocket forwards the token as the `token` query param (set
// via the provider's `params` option).
type authConfig struct {
	// jwtSecret is the shared HMAC secret. Empty disables verification (dev /
	// existing tests); production must set JWT_SECRET on every service.
	jwtSecret string
	// allowedOrigins is the CheckOrigin allowlist; empty accepts all (dev).
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

// checkOrigin enforces the configured allowlist. Empty allowlist accepts all
// (dev); a missing Origin header (non-browser / same-origin) is always allowed.
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

// authorized reports whether the request carries a valid token. When no secret
// is configured, verification is skipped and the request is always authorized.
func (c authConfig) authorized(r *http.Request) bool {
	if c.jwtSecret == "" {
		return true // verification disabled
	}
	raw := r.URL.Query().Get("token")
	if raw == "" {
		return false
	}
	token, err := jwt.Parse(raw, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(c.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return false
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return false
	}
	sub, ok := claims["sub"].(string)
	return ok && sub != ""
}
