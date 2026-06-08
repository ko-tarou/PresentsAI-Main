package store

import (
	"bytes"
	"sync"
	"testing"
)

func TestMemStoreAppendLoadRoundtrip(t *testing.T) {
	s := NewMemStore()
	if err := s.Append("r1", []byte("a")); err != nil {
		t.Fatal(err)
	}
	if err := s.Append("r1", []byte("b")); err != nil {
		t.Fatal(err)
	}
	got, err := s.Load("r1")
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 || !bytes.Equal(got[0], []byte("a")) || !bytes.Equal(got[1], []byte("b")) {
		t.Fatalf("roundtrip mismatch: %q", got)
	}
}

func TestMemStoreLoadUnknownRoomEmpty(t *testing.T) {
	got, err := NewMemStore().Load("nope")
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 0 {
		t.Fatalf("expected empty log, got %d", len(got))
	}
}

// TestMemStoreCopiesPayload: mutating the caller's buffer after Append must not
// corrupt stored data (the store owns a copy).
func TestMemStoreCopiesPayload(t *testing.T) {
	s := NewMemStore()
	buf := []byte{1, 2, 3}
	_ = s.Append("r", buf)
	buf[0] = 9
	got, _ := s.Load("r")
	if !bytes.Equal(got[0], []byte{1, 2, 3}) {
		t.Fatalf("store did not copy payload: %v", got[0])
	}
}

// TestMemStoreConcurrent: concurrent appends are race-free (run under -race).
func TestMemStoreConcurrent(t *testing.T) {
	s := NewMemStore()
	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = s.Append("r", []byte{0})
			_, _ = s.Load("r")
		}()
	}
	wg.Wait()
	got, _ := s.Load("r")
	if len(got) != 50 {
		t.Fatalf("expected 50 appends, got %d", len(got))
	}
}
