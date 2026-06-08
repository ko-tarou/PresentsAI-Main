package slide

import (
	"encoding/json"
	"testing"
)

// TestSlideJSONRoundTrip verifies the additive transition/animations/layoutRef
// fields survive a JSON marshal -> unmarshal round trip (the API wire format).
func TestSlideJSONRoundTrip(t *testing.T) {
	in := Slide{
		ID:             "s1",
		PresentationID: "p1",
		Position:       2,
		Notes:          "note",
		Content:        Content{"version": "6.0.0", "objects": []interface{}{}},
		Transition:     &Transition{Type: "fade", DurationMs: 300},
		Animations: []ElementAnimation{
			{TargetID: "obj-1", Type: "fadeIn", Order: 0, DurationMs: 200, DelayMs: 50},
			{TargetID: "obj-2", Type: "slideIn", Order: 1},
		},
		LayoutRef: "title",
	}

	b, err := json.Marshal(in)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var out Slide
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if out.Transition == nil || out.Transition.Type != "fade" || out.Transition.DurationMs != 300 {
		t.Errorf("transition not preserved: %+v", out.Transition)
	}
	if len(out.Animations) != 2 {
		t.Fatalf("animations length = %d, want 2", len(out.Animations))
	}
	if out.Animations[0].TargetID != "obj-1" || out.Animations[0].Type != "fadeIn" ||
		out.Animations[0].Order != 0 || out.Animations[0].DurationMs != 200 || out.Animations[0].DelayMs != 50 {
		t.Errorf("animation[0] not preserved: %+v", out.Animations[0])
	}
	if out.Animations[1].TargetID != "obj-2" || out.Animations[1].Order != 1 {
		t.Errorf("animation[1] not preserved: %+v", out.Animations[1])
	}
	if out.LayoutRef != "title" {
		t.Errorf("layoutRef = %q, want %q", out.LayoutRef, "title")
	}
}

// TestSlideJSONOmitsEmptyOptionalFields ensures a slide without the new fields
// does not emit them, so existing slides round-trip unchanged.
func TestSlideJSONOmitsEmptyOptionalFields(t *testing.T) {
	in := Slide{ID: "s1", Content: Content{"version": "6.0.0"}}

	b, err := json.Marshal(in)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(b, &raw); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	for _, k := range []string{"transition", "animations", "layoutRef"} {
		if _, ok := raw[k]; ok {
			t.Errorf("expected %q to be omitted when empty", k)
		}
	}
}
