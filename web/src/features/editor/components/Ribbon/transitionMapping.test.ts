import { describe, it, expect } from "vitest";
import type { ElementAnimation } from "@shared/types/slide";
import { toModelTransition, fromModelTransition } from "./TransitionTab";
import { toModelAnimation, fromModelAnimation, upsertAnimation } from "./AnimationTab";

describe("transition type mapping", () => {
  it("maps preview transition types to persisted model types", () => {
    expect(toModelTransition("none")).toBe("none");
    expect(toModelTransition("fade")).toBe("fade");
    expect(toModelTransition("zoom")).toBe("zoom");
    expect(toModelTransition("slide-left")).toBe("slide");
    expect(toModelTransition("slide-right")).toBe("push");
  });

  it("restores the UI selection from a persisted model type", () => {
    expect(fromModelTransition(undefined)).toBe("none");
    expect(fromModelTransition("none")).toBe("none");
    expect(fromModelTransition("fade")).toBe("fade");
    expect(fromModelTransition("zoom")).toBe("zoom");
    expect(fromModelTransition("slide")).toBe("slide-left");
    expect(fromModelTransition("push")).toBe("slide-right");
  });

  it("round-trips slide / push through the model and back", () => {
    expect(fromModelTransition(toModelTransition("slide-left"))).toBe("slide-left");
    expect(fromModelTransition(toModelTransition("slide-right"))).toBe("slide-right");
  });
});

describe("animation type mapping", () => {
  it("maps preview entrance types to persisted model animation types", () => {
    expect(toModelAnimation("fade-in")).toBe("fadeIn");
    expect(toModelAnimation("fly-in-left")).toBe("slideIn");
    expect(toModelAnimation("zoom-in")).toBe("zoomIn");
    expect(toModelAnimation("bounce")).toBe("bounce");
  });

  it("restores the UI selection from a persisted model animation type", () => {
    expect(fromModelAnimation(undefined)).toBe("none");
    expect(fromModelAnimation("fadeIn")).toBe("fade-in");
    expect(fromModelAnimation("slideIn")).toBe("fly-in-left");
    expect(fromModelAnimation("zoomIn")).toBe("zoom-in");
    expect(fromModelAnimation("bounce")).toBe("bounce");
  });

  it("maps the 'Out' variants back to the matching entrance choice", () => {
    expect(fromModelAnimation("fadeOut")).toBe("fade-in");
    expect(fromModelAnimation("slideOut")).toBe("fly-in-left");
    expect(fromModelAnimation("zoomOut")).toBe("zoom-in");
  });

  it("round-trips every entrance choice through the model and back", () => {
    expect(fromModelAnimation(toModelAnimation("fade-in"))).toBe("fade-in");
    expect(fromModelAnimation(toModelAnimation("fly-in-left"))).toBe("fly-in-left");
    expect(fromModelAnimation(toModelAnimation("zoom-in"))).toBe("zoom-in");
    expect(fromModelAnimation(toModelAnimation("bounce"))).toBe("bounce");
  });
});

describe("upsertAnimation", () => {
  const a: ElementAnimation = { targetId: "a", type: "fadeIn", order: 0, durationMs: 600 };
  const b: ElementAnimation = { targetId: "b", type: "slideIn", order: 1, durationMs: 600 };

  it("seeds a fade-in entrance when the target has no animation yet", () => {
    const next = upsertAnimation([a], "b", { delayMs: 200 });
    expect(next).toHaveLength(2);
    const created = next.find((x) => x.targetId === "b")!;
    expect(created.type).toBe("fadeIn");
    expect(created.order).toBe(1); // appended after the one existing animation
    expect(created.delayMs).toBe(200);
    expect(created.durationMs).toBe(600);
  });

  it("merges the patch onto the existing animation, preserving other fields", () => {
    const next = upsertAnimation([a, b], "a", { delayMs: 300, order: 2 });
    const updated = next.find((x) => x.targetId === "a")!;
    expect(updated.type).toBe("fadeIn"); // unchanged
    expect(updated.delayMs).toBe(300);
    expect(updated.order).toBe(2);
  });

  it("leaves other targets untouched", () => {
    const next = upsertAnimation([a, b], "a", { order: 5 });
    expect(next.find((x) => x.targetId === "b")).toEqual(b);
  });

  it("never duplicates the target", () => {
    const next = upsertAnimation([a, b], "a", { type: "zoomIn" });
    expect(next.filter((x) => x.targetId === "a")).toHaveLength(1);
    expect(next.find((x) => x.targetId === "a")!.type).toBe("zoomIn");
  });
});
