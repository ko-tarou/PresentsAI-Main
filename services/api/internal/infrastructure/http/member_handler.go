package http

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	appMember "github.com/ko-tarou/presentsai/services/api/internal/application/member"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http/middleware"
)

type MemberHandler struct {
	uc *appMember.UseCase
}

func NewMemberHandler(uc *appMember.UseCase) *MemberHandler {
	return &MemberHandler{uc: uc}
}

func (h *MemberHandler) HandleList(w http.ResponseWriter, r *http.Request) {
	callerID := r.Context().Value(middleware.UserIDKey).(string)
	presentationID := mux.Vars(r)["id"]
	members, err := h.uc.ListMembers(r.Context(), presentationID, callerID)
	if err != nil {
		writeHTTPError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"items": members})
}

func (h *MemberHandler) HandleInvite(w http.ResponseWriter, r *http.Request) {
	callerID := r.Context().Value(middleware.UserIDKey).(string)
	presentationID := mux.Vars(r)["id"]
	var req struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}
	if req.Role == "" {
		req.Role = "viewer"
	}
	member, err := h.uc.InviteByEmail(r.Context(), presentationID, callerID, req.Email, req.Role)
	if err != nil {
		if err.Error() == "user not found" {
			writeError(w, http.StatusNotFound, "user not found")
			return
		}
		writeHTTPError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, member)
}

func (h *MemberHandler) HandleUpdateRole(w http.ResponseWriter, r *http.Request) {
	callerID := r.Context().Value(middleware.UserIDKey).(string)
	vars := mux.Vars(r)
	presentationID, targetUserID := vars["id"], vars["userId"]
	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Role == "" {
		writeError(w, http.StatusBadRequest, "role is required")
		return
	}
	if err := h.uc.UpdateRole(r.Context(), presentationID, callerID, targetUserID, req.Role); err != nil {
		writeHTTPError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *MemberHandler) HandleRemove(w http.ResponseWriter, r *http.Request) {
	callerID := r.Context().Value(middleware.UserIDKey).(string)
	vars := mux.Vars(r)
	presentationID, targetUserID := vars["id"], vars["userId"]
	if err := h.uc.RemoveMember(r.Context(), presentationID, callerID, targetUserID); err != nil {
		writeHTTPError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
