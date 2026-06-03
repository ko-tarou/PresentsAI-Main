package http

import (
	"encoding/json"
	"errors"
	"net/http"

	appUser "github.com/ko-tarou/presentsai/services/api/internal/application/user"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http/middleware"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

type AuthHandler struct {
	authService *appUser.AuthService
}

func NewAuthHandler(authService *appUser.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"displayName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password are required")
		return
	}
	if len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	pair, err := h.authService.Register(r.Context(), req.Email, req.Password, req.DisplayName)
	if err != nil {
		if errors.Is(err, sharedErr.ErrAlreadyExists) {
			writeError(w, http.StatusConflict, "email already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, "registration failed")
		return
	}

	writeJSON(w, http.StatusCreated, pair)
}

func (h *AuthHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	pair, err := h.authService.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, sharedErr.ErrUnauthorized) {
			writeError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		writeError(w, http.StatusInternalServerError, "login failed")
		return
	}

	writeJSON(w, http.StatusOK, pair)
}

func (h *AuthHandler) HandleRefresh(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.RefreshToken == "" {
		writeError(w, http.StatusBadRequest, "refreshToken is required")
		return
	}

	pair, err := h.authService.Refresh(r.Context(), req.RefreshToken)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	writeJSON(w, http.StatusOK, pair)
}

// HandleLogout requires Auth middleware to be applied upstream (sets UserIDKey in context).
func (h *AuthHandler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.authService.Logout(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "logout failed")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
