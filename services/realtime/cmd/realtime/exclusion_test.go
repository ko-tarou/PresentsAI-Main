package main

import (
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// resetSessions clears the global session registry so exclusion tests start
// from a clean slate regardless of test ordering.
func resetSessions() {
	sessionsMu.Lock()
	sessions = make(map[string]*Session)
	sessionsMu.Unlock()
}

// TestSecondPresenterRejectedWith1008: with one presenter already connected, a
// second presenter on the same session is closed with PolicyViolation (1008)
// and the documented reason, while the first stays connected.
func TestSecondPresenterRejectedWith1008(t *testing.T) {
	resetSessions()
	withAuth(t, authConfig{}) // verification disabled; focus on exclusion
	srv := authServer()
	defer srv.Close()

	first, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/presenter?session=excl"), nil)
	if err != nil {
		t.Fatalf("first presenter dial: %v", err)
	}
	defer first.Close()
	// Let the server register the first presenter before the second connects.
	time.Sleep(50 * time.Millisecond)

	second, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/presenter?session=excl"), nil)
	if err != nil {
		t.Fatalf("second presenter dial (handshake should still succeed): %v", err)
	}
	defer second.Close()

	// The second connection must receive a 1008 close with the reason.
	var gotCode int
	var gotReason string
	second.SetCloseHandler(func(code int, text string) error {
		gotCode = code
		gotReason = text
		return nil
	})
	second.SetReadDeadline(time.Now().Add(time.Second))
	if _, _, err := second.ReadMessage(); err == nil {
		t.Fatal("expected second presenter to be closed")
	}
	if gotCode != websocket.ClosePolicyViolation {
		t.Fatalf("close code = %d, want %d", gotCode, websocket.ClosePolicyViolation)
	}
	if gotReason != "presenter already connected" {
		t.Fatalf("close reason = %q, want %q", gotReason, "presenter already connected")
	}

	// The incumbent presenter must still be the session's presenter.
	sessionsMu.RLock()
	sess := sessions["excl"]
	sessionsMu.RUnlock()
	sess.mu.RLock()
	stillPresent := sess.presenter != nil
	sess.mu.RUnlock()
	if !stillPresent {
		t.Fatal("incumbent presenter was cleared by the rejected second connection")
	}
}

// TestPresenterSlotFreedAfterDisconnect: once the first presenter disconnects,
// a new presenter can claim the slot.
func TestPresenterSlotFreedAfterDisconnect(t *testing.T) {
	resetSessions()
	withAuth(t, authConfig{})
	srv := authServer()
	defer srv.Close()

	first, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/presenter?session=reclaim"), nil)
	if err != nil {
		t.Fatalf("first presenter dial: %v", err)
	}
	time.Sleep(50 * time.Millisecond)
	first.Close()
	// Wait for the server-side read loop to observe the close and free the slot.
	time.Sleep(100 * time.Millisecond)

	second, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/presenter?session=reclaim"), nil)
	if err != nil {
		t.Fatalf("replacement presenter dial: %v", err)
	}
	defer second.Close()

	// It must NOT be rejected: no close frame should arrive promptly.
	second.SetReadDeadline(time.Now().Add(200 * time.Millisecond))
	if _, _, err := second.ReadMessage(); err == nil {
		t.Fatal("replacement presenter unexpectedly received a frame")
	} else if ce, ok := err.(*websocket.CloseError); ok && ce.Code == websocket.ClosePolicyViolation {
		t.Fatal("replacement presenter was rejected though the slot was free")
	}
}

// TestExclusionDoesNotAffectViewers: viewers are unaffected by presenter
// exclusion — multiple viewers coexist.
func TestExclusionDoesNotAffectViewers(t *testing.T) {
	resetSessions()
	withAuth(t, authConfig{})
	srv := authServer()
	defer srv.Close()

	for i := 0; i < 3; i++ {
		v, _, err := websocket.DefaultDialer.Dial(wsURL(srv.URL, "/viewer?session=many"), nil)
		if err != nil {
			t.Fatalf("viewer %d dial: %v", i, err)
		}
		defer v.Close()
	}
	time.Sleep(50 * time.Millisecond)
	sessionsMu.RLock()
	sess := sessions["many"]
	sessionsMu.RUnlock()
	sess.mu.RLock()
	n := len(sess.viewers)
	sess.mu.RUnlock()
	if n != 3 {
		t.Fatalf("viewer count = %d, want 3", n)
	}
}
