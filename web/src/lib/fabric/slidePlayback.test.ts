import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Canvas, FabricObject } from "fabric";
import type { ElementAnimation } from "@shared/types/slide";

// Spy on the entrance / exit primitives so we can assert orchestration without
// a real fabric canvas (jsdom can't run fabric's rendering pipeline).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const animateEntranceSpy = vi.fn((..._args: any[]) => Promise.resolve());
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const animateExitSpy = vi.fn((..._args: any[]) => Promise.resolve());
vi.mock("./animation", () => ({
  animateEntrance: (...args: unknown[]) => animateEntranceSpy(...args),
  animateExit: (...args: unknown[]) => animateExitSpy(...args),
}));

import {
  modelTransitionToPreview,
  modelAnimationToEntrance,
  modelAnimationToExit,
  isExitAnimation,
  hasTransition,
  playSlideAnimations,
  playSlideExitAnimations,
} from "./slidePlayback";

function makeObj(id: string): FabricObject {
  return { id } as unknown as FabricObject;
}
function makeCanvas(objs: FabricObject[]): Canvas {
  return { getObjects: () => objs } as unknown as Canvas;
}

describe("modelTransitionToPreview", () => {
  it("maps each persisted transition type to its preview type", () => {
    expect(modelTransitionToPreview("fade")).toBe("fade");
    expect(modelTransitionToPreview("slide")).toBe("slide-left");
    expect(modelTransitionToPreview("push")).toBe("slide-right");
    expect(modelTransitionToPreview("zoom")).toBe("zoom");
    expect(modelTransitionToPreview("none")).toBe("none");
    expect(modelTransitionToPreview(undefined)).toBe("none");
  });
});

describe("modelAnimationToEntrance", () => {
  it("maps in/out variants to the matching entrance motion", () => {
    expect(modelAnimationToEntrance("fadeIn")).toBe("fade-in");
    expect(modelAnimationToEntrance("fadeOut")).toBe("fade-in");
    expect(modelAnimationToEntrance("slideIn")).toBe("fly-in-left");
    expect(modelAnimationToEntrance("slideOut")).toBe("fly-in-left");
    expect(modelAnimationToEntrance("zoomIn")).toBe("zoom-in");
    expect(modelAnimationToEntrance("zoomOut")).toBe("zoom-in");
    expect(modelAnimationToEntrance("bounce")).toBe("bounce");
  });
});

describe("hasTransition", () => {
  it("is false for none / undefined and true otherwise", () => {
    expect(hasTransition(undefined)).toBe(false);
    expect(hasTransition({ type: "none" })).toBe(false);
    expect(hasTransition({ type: "fade" })).toBe(true);
  });
});

describe("playSlideAnimations", () => {
  beforeEach(() => animateEntranceSpy.mockClear());

  it("no-ops when there are no animations", async () => {
    await playSlideAnimations(makeCanvas([]), undefined);
    await playSlideAnimations(makeCanvas([]), []);
    expect(animateEntranceSpy).not.toHaveBeenCalled();
  });

  it("plays one entrance per resolvable target", async () => {
    const a = makeObj("obj-a");
    const b = makeObj("obj-b");
    const anims: ElementAnimation[] = [
      { targetId: "obj-a", type: "fadeIn", order: 0, durationMs: 300 },
      { targetId: "obj-b", type: "slideIn", order: 1 },
    ];
    await playSlideAnimations(makeCanvas([a, b]), anims);
    expect(animateEntranceSpy).toHaveBeenCalledTimes(2);
    // duration is forwarded (explicit 300 / default 600).
    expect(animateEntranceSpy).toHaveBeenCalledWith(expect.anything(), a, "fade-in", 300);
    expect(animateEntranceSpy).toHaveBeenCalledWith(expect.anything(), b, "fly-in-left", 600);
  });

  it("skips animations whose target object is missing", async () => {
    const a = makeObj("obj-a");
    const anims: ElementAnimation[] = [
      { targetId: "obj-a", type: "fadeIn", order: 0 },
      { targetId: "obj-gone", type: "zoomIn", order: 1 },
    ];
    await playSlideAnimations(makeCanvas([a]), anims);
    expect(animateEntranceSpy).toHaveBeenCalledTimes(1);
    expect(animateEntranceSpy).toHaveBeenCalledWith(expect.anything(), a, "fade-in", 600);
  });
});

describe("isExitAnimation", () => {
  it("is true only for the Out variants", () => {
    expect(isExitAnimation("fadeOut")).toBe(true);
    expect(isExitAnimation("slideOut")).toBe(true);
    expect(isExitAnimation("zoomOut")).toBe(true);
    expect(isExitAnimation("fadeIn")).toBe(false);
    expect(isExitAnimation("slideIn")).toBe(false);
    expect(isExitAnimation("zoomIn")).toBe(false);
    expect(isExitAnimation("bounce")).toBe(false);
  });
});

describe("modelAnimationToExit", () => {
  it("maps each Out variant to its preview exit type", () => {
    expect(modelAnimationToExit("fadeOut")).toBe("fade-out");
    expect(modelAnimationToExit("slideOut")).toBe("fly-out-left");
    expect(modelAnimationToExit("zoomOut")).toBe("zoom-out");
  });
  it("returns undefined for entrance / bounce types", () => {
    expect(modelAnimationToExit("fadeIn")).toBeUndefined();
    expect(modelAnimationToExit("slideIn")).toBeUndefined();
    expect(modelAnimationToExit("zoomIn")).toBeUndefined();
    expect(modelAnimationToExit("bounce")).toBeUndefined();
  });
});

describe("playSlideExitAnimations", () => {
  beforeEach(() => animateExitSpy.mockClear());

  it("no-ops when there are no animations", async () => {
    await playSlideExitAnimations(makeCanvas([]), undefined);
    await playSlideExitAnimations(makeCanvas([]), []);
    expect(animateExitSpy).not.toHaveBeenCalled();
  });

  it("plays only the Out variants, ignoring entrances", async () => {
    const a = makeObj("obj-a");
    const b = makeObj("obj-b");
    const c = makeObj("obj-c");
    const anims: ElementAnimation[] = [
      { targetId: "obj-a", type: "fadeIn", order: 0 },
      { targetId: "obj-b", type: "fadeOut", order: 1, durationMs: 300 },
      { targetId: "obj-c", type: "slideOut", order: 2 },
    ];
    await playSlideExitAnimations(makeCanvas([a, b, c]), anims);
    expect(animateExitSpy).toHaveBeenCalledTimes(2);
    expect(animateExitSpy).toHaveBeenCalledWith(expect.anything(), b, "fade-out", 300);
    expect(animateExitSpy).toHaveBeenCalledWith(expect.anything(), c, "fly-out-left", 600);
  });

  it("skips exits whose target object is missing", async () => {
    const a = makeObj("obj-a");
    const anims: ElementAnimation[] = [
      { targetId: "obj-a", type: "zoomOut", order: 0 },
      { targetId: "obj-gone", type: "fadeOut", order: 1 },
    ];
    await playSlideExitAnimations(makeCanvas([a]), anims);
    expect(animateExitSpy).toHaveBeenCalledTimes(1);
    expect(animateExitSpy).toHaveBeenCalledWith(expect.anything(), a, "zoom-out", 600);
  });
});
