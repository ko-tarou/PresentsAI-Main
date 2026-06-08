package yproto

import (
	"bytes"
	"encoding/hex"
	"testing"
)

func TestVarUintRoundTrip(t *testing.T) {
	cases := []uint64{0, 1, 127, 128, 255, 300, 16384, 1 << 21, 1<<63 - 1}
	for _, v := range cases {
		e := NewEncoder()
		e.WriteVarUint(v)
		d := NewDecoder(e.Bytes())
		got, err := d.ReadVarUint()
		if err != nil {
			t.Fatalf("decode %d: %v", v, err)
		}
		if got != v {
			t.Fatalf("var-uint round trip: got %d want %d", got, v)
		}
	}
}

func TestVarUint8ArrayRoundTrip(t *testing.T) {
	payload := []byte{0xde, 0xad, 0xbe, 0xef, 0x00, 0x7f, 0x80}
	e := NewEncoder()
	e.WriteVarUint8Array(payload)
	d := NewDecoder(e.Bytes())
	got, err := d.ReadVarUint8Array()
	if err != nil {
		t.Fatalf("decode array: %v", err)
	}
	if !bytes.Equal(got, payload) {
		t.Fatalf("array round trip: got %x want %x", got, payload)
	}
}

// TestDecodeRealUpdateFrame parses a real y-protocols Update frame (captured
// from a Yjs client) and confirms we extract the exact opaque payload.
func TestDecodeRealUpdateFrame(t *testing.T) {
	frame, _ := hex.DecodeString("00021f0101dfdac0c204012800dfdac0c20400057469746c6501770548656c6c6f00")
	wantUpdate, _ := hex.DecodeString("0101dfdac0c204012800dfdac0c20400057469746c6501770548656c6c6f00")

	d := NewDecoder(frame)
	mt, err := d.ReadVarUint()
	if err != nil || int(mt) != MessageSync {
		t.Fatalf("messageType=%d err=%v", mt, err)
	}
	step, err := d.ReadVarUint()
	if err != nil || int(step) != SyncUpdate {
		t.Fatalf("step=%d err=%v", step, err)
	}
	upd, err := d.ReadVarUint8Array()
	if err != nil {
		t.Fatalf("read update: %v", err)
	}
	if !bytes.Equal(upd, wantUpdate) {
		t.Fatalf("update payload: got %x want %x", upd, wantUpdate)
	}
}

// TestEncodeSyncUpdateMatchesYjs confirms our framing of an opaque update is
// byte-identical to what a Yjs client produces.
func TestEncodeSyncUpdateMatchesYjs(t *testing.T) {
	raw, _ := hex.DecodeString("0101dfdac0c204012800dfdac0c20400057469746c6501770548656c6c6f00")
	want, _ := hex.DecodeString("00021f0101dfdac0c204012800dfdac0c20400057469746c6501770548656c6c6f00")
	got := EncodeSyncUpdate(raw)
	if !bytes.Equal(got, want) {
		t.Fatalf("EncodeSyncUpdate: got %x want %x", got, want)
	}
}

func TestEncodeSyncStep1Empty(t *testing.T) {
	// messageSync(0) + SyncStep1(0) + varUint8Array([0]) => 00 00 01 00
	want, _ := hex.DecodeString("00000100")
	got := EncodeSyncStep1(EmptyStateVector)
	if !bytes.Equal(got, want) {
		t.Fatalf("EncodeSyncStep1(empty): got %x want %x", got, want)
	}
}

func TestTruncated(t *testing.T) {
	d := NewDecoder([]byte{0x05}) // says length 5 but no data follows
	if _, err := d.ReadVarUint8Array(); err != ErrTruncated {
		t.Fatalf("expected ErrTruncated, got %v", err)
	}
}
