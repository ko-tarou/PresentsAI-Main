import { describe, it, expect } from "vitest";
import { toModelTransition, fromModelTransition } from "./TransitionTab";
import { toModelAnimation } from "./AnimationTab";

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
    expect(toModelAnimation("bounce")).toBe("zoomIn");
  });
});
