package http

import (
	"encoding/json"
	"errors"
	"net/http"

	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeHTTPError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, sharedErr.ErrNotFound):
		writeError(w, http.StatusNotFound, "not found")
	case errors.Is(err, sharedErr.ErrForbidden):
		writeError(w, http.StatusForbidden, "forbidden")
	case errors.Is(err, sharedErr.ErrUnauthorized):
		writeError(w, http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, sharedErr.ErrAlreadyExists):
		writeError(w, http.StatusConflict, "already exists")
	default:
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}
