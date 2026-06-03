package postgres

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestJSONBValue(t *testing.T) {
	j := JSONB{"version": "6.0.0", "count": float64(3)}

	v, err := j.Value()
	if err != nil {
		t.Fatalf("Value returned error: %v", err)
	}
	b, ok := v.([]byte)
	if !ok {
		t.Fatalf("Value returned %T, want []byte", v)
	}

	// the bytes must be the JSON marshaling of the map
	want, _ := json.Marshal(map[string]interface{}(j))
	if string(b) != string(want) {
		t.Fatalf("Value = %s, want %s", b, want)
	}
}

func TestJSONBScan(t *testing.T) {
	t.Run("scans a JSON object from []byte", func(t *testing.T) {
		var j JSONB
		raw := []byte(`{"version":"6.0.0","objects":["rect"]}`)
		if err := j.Scan(raw); err != nil {
			t.Fatalf("Scan returned error: %v", err)
		}
		if j["version"] != "6.0.0" {
			t.Fatalf("version = %v, want 6.0.0", j["version"])
		}
		objs, ok := j["objects"].([]interface{})
		if !ok || len(objs) != 1 || objs[0] != "rect" {
			t.Fatalf("objects = %v, want [rect]", j["objects"])
		}
	})

	t.Run("non-[]byte value returns error", func(t *testing.T) {
		var j JSONB
		if err := j.Scan("a string, not bytes"); err == nil {
			t.Fatal("expected error for non-[]byte value, got nil")
		}
		if err := j.Scan(42); err == nil {
			t.Fatal("expected error for int value, got nil")
		}
		if err := j.Scan(nil); err == nil {
			t.Fatal("expected error for nil value, got nil")
		}
	})
}

func TestJSONBRoundTrip(t *testing.T) {
	orig := JSONB{
		"version": "6.0.0",
		"objects": []interface{}{"a", "b"},
		"nested":  map[string]interface{}{"x": float64(1)},
	}

	v, err := orig.Value()
	if err != nil {
		t.Fatalf("Value returned error: %v", err)
	}
	b := v.([]byte)

	var got JSONB
	if err := got.Scan(b); err != nil {
		t.Fatalf("Scan returned error: %v", err)
	}

	if !reflect.DeepEqual(map[string]interface{}(got), map[string]interface{}(orig)) {
		t.Fatalf("round-trip mismatch:\n got = %#v\nwant = %#v", got, orig)
	}
}
