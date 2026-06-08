package hub

import (
	"bytes"
	"testing"

	"github.com/ko-tarou/presentsai/services/collab/internal/store"
	"github.com/ko-tarou/presentsai/services/collab/internal/yproto"
)

// TestUpdatePersistedToStore: an inbound update is written through to the Store,
// not just the in-memory cache.
func TestUpdatePersistedToStore(t *testing.T) {
	s := store.NewMemStore()
	h := New(s)
	room := h.Room("deck-1")
	a := &fakeClient{id: "a"}
	room.Join(a)

	room.HandleMessage(a, hexMust(t, updateFrame))

	loaded, err := s.Load("deck-1")
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if len(loaded) != 1 {
		t.Fatalf("expected 1 persisted update, got %d", len(loaded))
	}
	if !bytes.Equal(loaded[0], hexMust(t, rawUpdate)) {
		t.Fatalf("persisted payload mismatch: got %x", loaded[0])
	}
}

// TestRoomRestoredFromStore simulates a server restart: a Store already holds a
// room's update log, a fresh Hub is created over it, and a newcomer joining the
// room must receive the restored snapshot. This proves reload-resilience and
// that the *server* (not the first client) re-seeds the baseline.
func TestRoomRestoredFromStore(t *testing.T) {
	s := store.NewMemStore()
	// Pre-seed the durable log as if a previous server instance had stored it.
	if err := s.Append("deck-1", hexMust(t, rawUpdate)); err != nil {
		t.Fatal(err)
	}
	if err := s.Append("deck-1", hexMust(t, rawUpdate)); err != nil {
		t.Fatal(err)
	}

	// Fresh Hub over the same store == server restart.
	h := New(s)
	room := h.Room("deck-1")
	if room.UpdateCount() != 2 {
		t.Fatalf("room should restore 2 updates from store, got %d", room.UpdateCount())
	}

	// Newcomer joins and announces an empty state vector; expects replay.
	join := &fakeClient{id: "join"}
	room.Join(join)
	room.HandleMessage(join, hexMust(t, syncStep1Empty))

	if len(join.recv) != 3 { // 2 replayed updates + server SyncStep1
		t.Fatalf("expected 3 frames (2 restored updates + SyncStep1), got %d", len(join.recv))
	}
	wantUpdate := yproto.EncodeSyncUpdate(hexMust(t, rawUpdate))
	if !bytes.Equal(join.recv[0], wantUpdate) || !bytes.Equal(join.recv[1], wantUpdate) {
		t.Fatalf("restored snapshot frames are not the stored updates")
	}
}

// TestRoomsShareNoStateAcrossStore: distinct rooms restore independently.
func TestRoomsShareNoStateAcrossStore(t *testing.T) {
	s := store.NewMemStore()
	_ = s.Append("deck-1", hexMust(t, rawUpdate))

	h := New(s)
	if got := h.Room("deck-1").UpdateCount(); got != 1 {
		t.Fatalf("deck-1 should restore 1 update, got %d", got)
	}
	if got := h.Room("deck-2").UpdateCount(); got != 0 {
		t.Fatalf("deck-2 should restore 0 updates, got %d", got)
	}
}
