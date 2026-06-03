package http

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	appSlide "github.com/ko-tarou/presentsai/services/api/internal/application/slide"
	domainSlide "github.com/ko-tarou/presentsai/services/api/internal/domain/slide"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http/middleware"
)

type SlideHandler struct {
	uc *appSlide.UseCase
}

func NewSlideHandler(uc *appSlide.UseCase) *SlideHandler {
	return &SlideHandler{uc: uc}
}

func (h *SlideHandler) HandleList(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	presentationID := mux.Vars(r)["id"]
	slides, err := h.uc.List(r.Context(), presentationID, ownerID)
	if err != nil {
		writeHTTPError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"items": slides})
}

func (h *SlideHandler) HandleCreate(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	presentationID := mux.Vars(r)["id"]
	s, err := h.uc.Create(r.Context(), presentationID, ownerID)
	if err != nil {
		writeHTTPError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, s)
}

func (h *SlideHandler) HandleGet(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	id := mux.Vars(r)["slideId"]
	s, err := h.uc.Get(r.Context(), id, ownerID)
	if err != nil {
		writeHTTPError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func (h *SlideHandler) HandleUpdate(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	id := mux.Vars(r)["slideId"]
	var req struct {
		Content domainSlide.Content `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	s, err := h.uc.UpdateContent(r.Context(), id, ownerID, req.Content)
	if err != nil {
		writeHTTPError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func (h *SlideHandler) HandleDelete(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	id := mux.Vars(r)["slideId"]
	if err := h.uc.Delete(r.Context(), id, ownerID); err != nil {
		writeHTTPError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *SlideHandler) HandleReorder(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	presentationID := mux.Vars(r)["id"]
	var req struct {
		Positions map[string]int `json:"positions"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.Positions) == 0 {
		writeError(w, http.StatusBadRequest, "positions map is required")
		return
	}
	if err := h.uc.Reorder(r.Context(), presentationID, ownerID, req.Positions); err != nil {
		writeHTTPError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
