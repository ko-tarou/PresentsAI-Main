import { describe, it, expect } from "vitest";
import { toModelTransition, fromModelTransition } from "./TransitionTab";
import { toModelAnimation, fromModelAnimation } from "./AnimationTab";

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
