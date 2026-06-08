package main

import (
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"

	"github.com/ko-tarou/presentsai/services/collab/internal/hub"
	"github.com/ko-tarou/presentsai/services/collab/internal/yproto"
)

// Real Yjs fixtures captured from a y-protocols client (see internal/hub tests).
const (
	syncStep1Empty = "00000100"
	updateFrame    = "00021f0101dfdac0c204012800dfdac0c20400057469746c6501770548656c6c6f00"
	rawUpdate      = "0101dfdac0c204012800dfdac0c20400057469746c6501770548656c6c6f00"
)

func mustHex(t *testing.T, s string) []byte {
	t.Helper()
	b, err := hex.DecodeString(s)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

// dial opens a websocket to the test server's room path (y-websocket style).
func dial(t *testing.T, srv *httptest.Server, room string) *websocket.Conn {
	t.Helper()
	url := "ws" + strings.TrimPrefix(srv.URL, "http") + "/" + room
	c, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		t.Fatalf("dial %s: %v", url, err)
	}
	return c
}

func readBinary(t *testing.T, c *websocket.Conn) []byte {
	t.Helper()
	c.SetReadDeadline(time.Now().Add(2 * time.Second))
	mt, msg, err := c.ReadMessage()
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if mt != websocket.BinaryMessage {
		t.Fatalf("expected binary frame, got type %d", mt)
	}
	return msg
}

// TestE2ESyncStep1OverWebsocket: a client connecting to a populated room over a
// real websocket receives the snapshot replay followed by the server SyncStep1.
func TestE2ESyncStep1OverWebsocket(t *testing.T) {
	h := hub.New()
	srv := httptest.NewServer(makeHandler(h))
	defer srv.Close()

	// Seeder pushes one update into the room.
	seed := dial(t, srv, "deck-e2e")
	defer seed.Close()
	if err := seed.WriteMessage(websocket.BinaryMessage, mustHex(t, updateFrame)); err != nil {
		t.Fatal(err)
	}
	// Wait for the server to store it.
	deadline := time.Now().Add(2 * time.Second)
	for h.Room("deck-e2e").UpdateCount() == 0 && time.Now().Before(deadline) {
		time.Sleep(5 * time.Millisecond)
	}
	if h.Room("deck-e2e").UpdateCount() != 1 {
		t.Fatalf("seed update not stored")
	}

	// Joiner connects and sends SyncStep1; should get the stored update + SyncStep1.
	join := dial(t, srv, "deck-e2e")
	defer join.Close()
	if err := join.WriteMessage(websocket.BinaryMessage, mustHex(t, syncStep1Empty)); err != nil {
		t.Fatal(err)
	}

	first := readBinary(t, join)
	wantUpdate := yproto.EncodeSyncUpdate(mustHex(t, rawUpdate))
	if hex.EncodeToString(first) != hex.EncodeToString(wantUpdate) {
		t.Fatalf("first frame: got %x want %x", first, wantUpdate)
	}
	second := readBinary(t, join)
	wantStep1 := yproto.EncodeSyncStep1(yproto.EmptyStateVector)
	if hex.EncodeToString(second) != hex.EncodeToString(wantStep1) {
		t.Fatalf("second frame: got %x want %x", second, wantStep1)
	}
}

// TestE2EBroadcastBetweenTwoClients: an update from one client is relayed to a
// second client in the same room over real websockets.
func TestE2EBroadcastBetweenTwoClients(t *testing.T) {
	h := hub.New()
	srv := httptest.NewServer(makeHandler(h))
	defer srv.Close()

	a := dial(t, srv, "deck-bcast")
	defer a.Close()
	b := dial(t, srv, "deck-bcast")
	defer b.Close()

	if err := a.WriteMessage(websocket.BinaryMessage, mustHex(t, updateFrame)); err != nil {
		t.Fatal(err)
	}

	got := readBinary(t, b)
	want := yproto.EncodeSyncUpdate(mustHex(t, rawUpdate))
	if hex.EncodeToString(got) != hex.EncodeToString(want) {
		t.Fatalf("broadcast: got %x want %x", got, want)
	}
}

// TestE2EHealth: the /health endpoint stays a plain JSON probe, not a room.
func TestE2EHealth(t *testing.T) {
	h := hub.New()
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("/", makeHandler(h))
	srv := httptest.NewServer(mux)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/health")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("health status %d", resp.StatusCode)
	}
}
