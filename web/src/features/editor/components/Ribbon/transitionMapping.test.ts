import { describe, it, expect } from "vitest";
import type { ElementAnimation } from "@shared/types/slide";
import { toModelTransition, fromModelTransition } from "./TransitionTab";
import {
  toModelAnimation,
  fromModelAnimation,
  toModelExit,
  fromModelExit,
  upsertAnimation,
  removeAnimation,
} from "./AnimationTab";

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

  it("does not treat 'Out' variants as an entrance selection", () => {
    expect(fromModelAnimation("fadeOut")).toBe("none");
    expect(fromModelAnimation("slideOut")).toBe("none");
    expect(fromModelAnimation("zoomOut")).toBe("none");
  });

  it("round-trips every entrance choice through the model and back", () => {
    expect(fromModelAnimation(toModelAnimation("fade-in"))).toBe("fade-in");
    expect(fromModelAnimation(toModelAnimation("fly-in-left"))).toBe("fly-in-left");
    expect(fromModelAnimation(toModelAnimation("zoom-in"))).toBe("zoom-in");
    expect(fromModelAnimation(toModelAnimation("bounce"))).toBe("bounce");
  });
});

describe("exit animation type mapping", () => {
  it("maps preview exit types to persisted 'Out' model types", () => {
    expect(toModelExit("fade-out")).toBe("fadeOut");
    expect(toModelExit("fly-out-left")).toBe("slideOut");
    expect(toModelExit("zoom-out")).toBe("zoomOut");
  });

  it("restores the exit selection from a persisted model type", () => {
    expect(fromModelExit(undefined)).toBe("none");
    expect(fromModelExit("fadeOut")).toBe("fade-out");
    expect(fromModelExit("slideOut")).toBe("fly-out-left");
    expect(fromModelExit("zoomOut")).toBe("zoom-out");
  });

  it("returns 'none' for entrance / bounce types", () => {
    expect(fromModelExit("fadeIn")).toBe("none");
    expect(fromModelExit("slideIn")).toBe("none");
    expect(fromModelExit("zoomIn")).toBe("none");
    expect(fromModelExit("bounce")).toBe("none");
  });

  it("round-trips every exit choice through the model and back", () => {
    expect(fromModelExit(toModelExit("fade-out"))).toBe("fade-out");
    expect(fromModelExit(toModelExit("fly-out-left"))).toBe("fly-out-left");
    expect(fromModelExit(toModelExit("zoom-out"))).toBe("zoom-out");
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

  it("never duplicates the entrance slot of a target", () => {
    const next = upsertAnimation([a, b], "a", { type: "zoomIn" });
    expect(next.filter((x) => x.targetId === "a")).toHaveLength(1);
    expect(next.find((x) => x.targetId === "a")!.type).toBe("zoomIn");
  });
});

describe("upsertAnimation — exit slot", () => {
  const enter: ElementAnimation = { targetId: "a", type: "fadeIn", order: 0, durationMs: 600 };

  it("seeds a fade-out exit when the target has no exit yet", () => {
    const next = upsertAnimation([enter], "a", { delayMs: 100 }, "exit");
    expect(next).toHaveLength(2);
    const created = next.find((x) => x.targetId === "a" && x.type === "fadeOut")!;
    expect(created.type).toBe("fadeOut");
    expect(created.delayMs).toBe(100);
  });

  it("keeps entrance and exit on the same target independent", () => {
    let next = upsertAnimation([], "a", { type: "fadeIn" }, "entrance");
    next = upsertAnimation(next, "a", { type: "slideOut" }, "exit");
    const onTarget = next.filter((x) => x.targetId === "a");
    expect(onTarget).toHaveLength(2);
    expect(onTarget.map((x) => x.type).sort()).toEqual(["fadeIn", "slideOut"]);

    // Updating the exit must not clobber the entrance.
    next = upsertAnimation(next, "a", { type: "zoomOut" }, "exit");
    const after = next.filter((x) => x.targetId === "a");
    expect(after).toHaveLength(2);
    expect(after.find((x) => x.type === "fadeIn")).toBeTruthy();
    expect(after.find((x) => x.type === "zoomOut")).toBeTruthy();
  });
});

describe("removeAnimation", () => {
  it("removes only the named slot, leaving the other slot intact", () => {
    const list: ElementAnimation[] = [
      { targetId: "a", type: "fadeIn", order: 0 },
      { targetId: "a", type: "zoomOut", order: 1 },
    ];
    const noExit = removeAnimation(list, "a", "exit");
    expect(noExit).toHaveLength(1);
    expect(noExit[0].type).toBe("fadeIn");

    const noEnter = removeAnimation(list, "a", "entrance");
    expect(noEnter).toHaveLength(1);
    expect(noEnter[0].type).toBe("zoomOut");
  });

  it("leaves other targets untouched", () => {
    const list: ElementAnimation[] = [
      { targetId: "a", type: "fadeOut", order: 0 },
      { targetId: "b", type: "slideOut", order: 1 },
    ];
    const next = removeAnimation(list, "a", "exit");
    expect(next).toEqual([{ targetId: "b", type: "slideOut", order: 1 }]);
  });
});
