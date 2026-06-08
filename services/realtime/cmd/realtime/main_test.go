package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// wsURL rewrites an httptest http(s) URL to a ws(s) URL with the given path/query.
func wsURL(base, pathQuery string) string {
	return "ws" + strings.TrimPrefix(base, "http") + pathQuery
}

// TestPresenterBroadcastsToViewer verifies the core P1 path: a slide-change
// sent by the presenter is delivered verbatim to every connected viewer.
func TestPresenterBroadcastsToViewer(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/presenter", handlePresenter)
	mux.HandleFunc("/viewer", handleViewer)
	srv := httptest.NewServer(mux)
	defer srv.Close()

	dialer := websocket.DefaultDialer

	viewer, _, err := dialer.Dial(wsURL(srv.URL, "/viewer?session=room1"), nil)
	if err != nil {
		t.Fatalf("viewer dial: %v", err)
	}
	defer viewer.Close()

	presenter, _, err := dialer.Dial(wsURL(srv.URL, "/presenter?session=room1"), nil)
	if err != nil {
		t.Fatalf("presenter dial: %v", err)
	}
	defer presenter.Close()

	// Give the viewer time to be registered in the session before broadcasting.
	time.Sleep(50 * time.Millisecond)

	payload := []byte(`{"type":"slide-change","slideIndex":4}`)
	if err := presenter.WriteMessage(websocket.TextMessage, payload); err != nil {
		t.Fatalf("presenter write: %v", err)
	}

	viewer.SetReadDeadline(time.Now().Add(time.Second))
	_, got, err := viewer.ReadMessage()
	if err != nil {
		t.Fatalf("viewer read: %v", err)
	}
	if string(got) != string(payload) {
		t.Fatalf("viewer got %q, want %q", got, payload)
	}
}

// TestViewersAreIsolatedBySession ensures a slide-change in one session does
// not leak to viewers of a different session.
func TestViewersAreIsolatedBySession(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/presenter", handlePresenter)
	mux.HandleFunc("/viewer", handleViewer)
	srv := httptest.NewServer(mux)
	defer srv.Close()

	dialer := websocket.DefaultDialer

	otherViewer, _, err := dialer.Dial(wsURL(srv.URL, "/viewer?session=other"), nil)
	if err != nil {
		t.Fatalf("other viewer dial: %v", err)
	}
	defer otherViewer.Close()

	presenter, _, err := dialer.Dial(wsURL(srv.URL, "/presenter?session=room1"), nil)
	if err != nil {
		t.Fatalf("presenter dial: %v", err)
	}
	defer presenter.Close()

	time.Sleep(50 * time.Millisecond)
	if err := presenter.WriteMessage(websocket.TextMessage, []byte(`{"type":"slide-change","slideIndex":1}`)); err != nil {
		t.Fatalf("presenter write: %v", err)
	}

	// The unrelated viewer must NOT receive anything.
	otherViewer.SetReadDeadline(time.Now().Add(200 * time.Millisecond))
	if _, _, err := otherViewer.ReadMessage(); err == nil {
		t.Fatalf("viewer in another session unexpectedly received a broadcast")
	}
}

// TestLateJoinerReceivesSnapshot covers the P2 late-join fix: a viewer that
// connects AFTER the presenter has already advanced must immediately receive
// the current slide, not slide 0.
func TestLateJoinerReceivesSnapshot(t *testing.T) {
	// Fresh registry so a prior test's session cannot leak state in.
	sessionsMu.Lock()
	sessions = make(map[string]*Session)
	sessionsMu.Unlock()

	mux := http.NewServeMux()
	mux.HandleFunc("/presenter", handlePresenter)
	mux.HandleFunc("/viewer", handleViewer)
	srv := httptest.NewServer(mux)
	defer srv.Close()

	dialer := websocket.DefaultDialer

	// Presenter connects and advances to slide 7 with no viewers attached yet.
	presenter, _, err := dialer.Dial(wsURL(srv.URL, "/presenter?session=late"), nil)
	if err != nil {
		t.Fatalf("presenter dial: %v", err)
	}
	defer presenter.Close()

	snapshot := []byte(`{"type":"slide-change","slideIndex":7}`)
	if err := presenter.WriteMessage(websocket.TextMessage, snapshot); err != nil {
		t.Fatalf("presenter write: %v", err)
	}
	// Let the server record lastState before the viewer joins.
	time.Sleep(50 * time.Millisecond)

	// Late viewer joins and must be synced to slide 7 right away.
	viewer, _, err := dialer.Dial(wsURL(srv.URL, "/viewer?session=late"), nil)
	if err != nil {
		t.Fatalf("late viewer dial: %v", err)
	}
	defer viewer.Close()

	viewer.SetReadDeadline(time.Now().Add(time.Second))
	_, got, err := viewer.ReadMessage()
	if err != nil {
		t.Fatalf("late viewer read: %v", err)
	}
	if string(got) != string(snapshot) {
		t.Fatalf("late viewer got %q, want %q", got, snapshot)
	}
}

// TestViewerWithoutPriorStateGetsNoSnapshot ensures a viewer that joins before
// any slide-change is not sent a stray empty/zero frame.
func TestViewerWithoutPriorStateGetsNoSnapshot(t *testing.T) {
	sessionsMu.Lock()
	sessions = make(map[string]*Session)
	sessionsMu.Unlock()

	mux := http.NewServeMux()
	mux.HandleFunc("/viewer", handleViewer)
	srv := httptest.NewServer(mux)
	defer srv.Close()

	viewer, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/viewer?session=empty"), nil)
	if err != nil {
		t.Fatalf("viewer dial: %v", err)
	}
	defer viewer.Close()

	viewer.SetReadDeadline(time.Now().Add(200 * time.Millisecond))
	if _, _, err := viewer.ReadMessage(); err == nil {
		t.Fatalf("viewer unexpectedly received a snapshot with no prior state")
	}
}
