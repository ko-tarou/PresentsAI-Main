package hub

import (
	"bytes"
	"encoding/hex"
	"testing"

	"github.com/ko-tarou/presentsai/services/collab/internal/yproto"
)

// fakeClient records every frame the hub sends to it.
type fakeClient struct {
	id   string
	recv [][]byte
}

func (c *fakeClient) Send(data []byte) {
	c.recv = append(c.recv, append([]byte(nil), data...))
}

// hexMust decodes a hex string in a test fixture.
func hexMust(t *testing.T, s string) []byte {
	t.Helper()
	b, err := hex.DecodeString(s)
	if err != nil {
		t.Fatalf("bad hex %q: %v", s, err)
	}
	return b
}

// Real Yjs fixtures (captured from a y-protocols client).
const (
	syncStep1Empty = "00000100" // messageSync, SyncStep1, empty state vector
	updateFrame    = "00021f0101dfdac0c204012800dfdac0c20400057469746c6501770548656c6c6f00"
	rawUpdate      = "0101dfdac0c204012800dfdac0c20400057469746c6501770548656c6c6f00"
	awarenessFrame = "010401020304" // messageAwareness with opaque payload
)

// TestUpdateStoredAndBroadcast: an Update frame is appended to the room log and
// relayed to the *other* client (not echoed back to the sender).
func TestUpdateStoredAndBroadcast(t *testing.T) {
	h := New(nil)
	room := h.Room("deck-1")
	a := &fakeClient{id: "a"}
	b := &fakeClient{id: "b"}
	room.Join(a)
	room.Join(b)

	room.HandleMessage(a, hexMust(t, updateFrame))

	if room.UpdateCount() != 1 {
		t.Fatalf("expected 1 stored update, got %d", room.UpdateCount())
	}
	if len(a.recv) != 0 {
		t.Fatalf("sender should not receive its own update, got %d frames", len(a.recv))
	}
	if len(b.recv) != 1 {
		t.Fatalf("peer should receive 1 relayed update, got %d", len(b.recv))
	}
	// Relayed frame should carry the exact opaque update payload.
	want := yproto.EncodeSyncUpdate(hexMust(t, rawUpdate))
	if !bytes.Equal(b.recv[0], want) {
		t.Fatalf("relayed frame: got %x want %x", b.recv[0], want)
	}
}

// TestSyncStep1ReplaysSnapshot: a newcomer sending SyncStep1 receives every
// stored update followed by the server's own SyncStep1 (empty state vector).
func TestSyncStep1ReplaysSnapshot(t *testing.T) {
	h := New(nil)
	room := h.Room("deck-1")

	// Seed the room with two stored updates via an existing client.
	seeder := &fakeClient{id: "seed"}
	room.Join(seeder)
	room.HandleMessage(seeder, hexMust(t, updateFrame))
	room.HandleMessage(seeder, hexMust(t, updateFrame))
	if room.UpdateCount() != 2 {
		t.Fatalf("expected 2 stored updates, got %d", room.UpdateCount())
	}

	// Newcomer connects and announces its (empty) state vector.
	joiner := &fakeClient{id: "join"}
	room.Join(joiner)
	room.HandleMessage(joiner, hexMust(t, syncStep1Empty))

	// Expect: 2 replayed updates + 1 server SyncStep1.
	if len(joiner.recv) != 3 {
		t.Fatalf("expected 3 frames (2 updates + SyncStep1), got %d", len(joiner.recv))
	}
	wantUpdate := yproto.EncodeSyncUpdate(hexMust(t, rawUpdate))
	if !bytes.Equal(joiner.recv[0], wantUpdate) || !bytes.Equal(joiner.recv[1], wantUpdate) {
		t.Fatalf("snapshot frames not the stored updates")
	}
	wantStep1 := yproto.EncodeSyncStep1(yproto.EmptyStateVector)
	if !bytes.Equal(joiner.recv[2], wantStep1) {
		t.Fatalf("final frame: got %x want server SyncStep1 %x", joiner.recv[2], wantStep1)
	}
}

// TestSyncStep2Stored: a SyncStep2 (full-state reply) is stored and broadcast
// just like an Update.
func TestSyncStep2Stored(t *testing.T) {
	h := New(nil)
	room := h.Room("deck-1")
	a := &fakeClient{id: "a"}
	b := &fakeClient{id: "b"}
	room.Join(a)
	room.Join(b)

	step2 := yproto.EncodeSyncStep2(hexMust(t, rawUpdate))
	room.HandleMessage(a, step2)

	if room.UpdateCount() != 1 {
		t.Fatalf("SyncStep2 should be stored, count=%d", room.UpdateCount())
	}
	if len(b.recv) != 1 {
		t.Fatalf("SyncStep2 should be broadcast as Update, got %d", len(b.recv))
	}
	// Broadcast is normalized to an Update message.
	want := yproto.EncodeSyncUpdate(hexMust(t, rawUpdate))
	if !bytes.Equal(b.recv[0], want) {
		t.Fatalf("broadcast frame: got %x want %x", b.recv[0], want)
	}
}

// TestAwarenessRelayedNotStored: awareness is relayed verbatim and not stored.
func TestAwarenessRelayedNotStored(t *testing.T) {
	h := New(nil)
	room := h.Room("deck-1")
	a := &fakeClient{id: "a"}
	b := &fakeClient{id: "b"}
	room.Join(a)
	room.Join(b)

	frame := hexMust(t, awarenessFrame)
	room.HandleMessage(a, frame)

	if room.UpdateCount() != 0 {
		t.Fatalf("awareness must not be stored, count=%d", room.UpdateCount())
	}
	if len(b.recv) != 1 || !bytes.Equal(b.recv[0], frame) {
		t.Fatalf("awareness should be relayed verbatim to peer")
	}
	if len(a.recv) != 0 {
		t.Fatalf("awareness should not echo back to sender")
	}
}

// TestRoomSeparation: updates in one room never leak into another.
func TestRoomSeparation(t *testing.T) {
	h := New(nil)
	r1 := h.Room("deck-1")
	r2 := h.Room("deck-2")
	a := &fakeClient{id: "a"} // in deck-1
	b := &fakeClient{id: "b"} // in deck-2
	r1.Join(a)
	r2.Join(b)

	r1.HandleMessage(a, hexMust(t, updateFrame))

	if r1.UpdateCount() != 1 {
		t.Fatalf("deck-1 should have 1 update, got %d", r1.UpdateCount())
	}
	if r2.UpdateCount() != 0 {
		t.Fatalf("deck-2 must stay empty, got %d", r2.UpdateCount())
	}
	if len(b.recv) != 0 {
		t.Fatalf("client in deck-2 must not receive deck-1 traffic, got %d", len(b.recv))
	}
	if h.RoomCount() != 2 {
		t.Fatalf("expected 2 rooms, got %d", h.RoomCount())
	}
}

// TestLeaveStopsBroadcast: a client that left no longer receives broadcasts.
func TestLeaveStopsBroadcast(t *testing.T) {
	h := New(nil)
	room := h.Room("deck-1")
	a := &fakeClient{id: "a"}
	b := &fakeClient{id: "b"}
	room.Join(a)
	room.Join(b)
	room.Leave(b)

	room.HandleMessage(a, hexMust(t, updateFrame))
	if len(b.recv) != 0 {
		t.Fatalf("left client should receive nothing, got %d", len(b.recv))
	}
}

// TestMalformedIgnored: garbage frames are ignored without panicking or storing.
func TestMalformedIgnored(t *testing.T) {
	h := New(nil)
	room := h.Room("deck-1")
	a := &fakeClient{id: "a"}
	room.Join(a)

	room.HandleMessage(a, []byte{})           // empty
	room.HandleMessage(a, []byte{0x00})       // sync, but no step
	room.HandleMessage(a, []byte{0x00, 0x02}) // update, but no payload
	room.HandleMessage(a, []byte{0xff, 0xff}) // unknown message type

	if room.UpdateCount() != 0 {
		t.Fatalf("malformed frames must not be stored, count=%d", room.UpdateCount())
	}
}
