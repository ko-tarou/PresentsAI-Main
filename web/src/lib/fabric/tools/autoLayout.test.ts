import { describe, it, expect, vi } from "vitest";
import { applyAutoLayout, distributeObjects } from "./autoLayout";
import type { Canvas } from "fabric";

/**
 * A fake Fabric object exposing only the geometry surface autoLayout touches:
 * left/top, scaled size getters, and set/setCoords. set() mutates left/top so
 * we can assert the resulting positions.
 */
function obj(left: number, top: number, w: number, h: number) {
  return {
    left,
    top,
    getScaledWidth: () => w,
    getScaledHeight: () => h,
    set(patch: { left?: number; top?: number }) {
      if (patch.left !== undefined) this.left = patch.left;
      if (patch.top !== undefined) this.top = patch.top;
    },
    setCoords: vi.fn(),
  };
}

type FakeObj = ReturnType<typeof obj>;

function canvasWith(objs: FakeObj[]): Canvas {
  return {
    getActiveObjects: () => objs,
    renderAll: vi.fn(),
  } as unknown as Canvas;
}

describe("applyAutoLayout", () => {
  it("does nothing with fewer than two objects", () => {
    const a = obj(100, 100, 50, 30);
    applyAutoLayout(canvasWith([a]), {
      direction: "horizontal",
      gap: 10,
      padding: 0,
      align: "start",
    });
    // Unchanged.
    expect(a.left).toBe(100);
    expect(a.top).toBe(100);
  });

  it("packs objects horizontally with padding + gap, sorted by left", () => {
    // Provided out of order to prove it sorts by left first.
    const a = obj(200, 5, 50, 20); // rightmost
    const b = obj(0, 5, 30, 20); // leftmost
    applyAutoLayout(canvasWith([a, b]), {
      direction: "horizontal",
      gap: 10,
      padding: 8,
      align: "start",
    });
    // b (width 30) goes first at padding=8, then a at 8+30+10=48.
    expect(b.left).toBe(8);
    expect(a.left).toBe(48);
    // align "start" -> top = padding.
    expect(b.top).toBe(8);
    expect(a.top).toBe(8);
  });

  it("packs objects vertically and centers on the cross axis", () => {
    const a = obj(5, 0, 40, 20); // narrower
    const b = obj(5, 100, 80, 30); // widest -> defines maxCross = 80
    applyAutoLayout(canvasWith([a, b]), {
      direction: "vertical",
      gap: 5,
      padding: 0,
      align: "center",
    });
    // Stacked: a at top 0, b at 0+20+5=25.
    expect(a.top).toBe(0);
    expect(b.top).toBe(25);
    // center cross: a (width 40) -> left = (80-40)/2 = 20; b (width 80) -> 0.
    expect(a.left).toBe(20);
    expect(b.left).toBe(0);
  });

  it("aligns to the end of the cross axis when align=end", () => {
    const a = obj(0, 0, 40, 20);
    const b = obj(0, 50, 80, 20); // maxCross = 80
    applyAutoLayout(canvasWith([a, b]), {
      direction: "vertical",
      gap: 0,
      padding: 0,
      align: "end",
    });
    // a left = 80-40 = 40; b left = 80-80 = 0.
    expect(a.left).toBe(40);
    expect(b.left).toBe(0);
  });

  it("calls setCoords on every laid-out object", () => {
    const a = obj(0, 0, 10, 10);
    const b = obj(20, 0, 10, 10);
    applyAutoLayout(canvasWith([a, b]), {
      direction: "horizontal",
      gap: 0,
      padding: 0,
      align: "start",
    });
    expect(a.setCoords).toHaveBeenCalled();
    expect(b.setCoords).toHaveBeenCalled();
  });
});

describe("distributeObjects", () => {
  it("does nothing with fewer than three objects", () => {
    const a = obj(0, 0, 10, 10);
    const b = obj(100, 0, 10, 10);
    distributeObjects(canvasWith([a, b]), "horizontal");
    expect(a.left).toBe(0);
    expect(b.left).toBe(100);
  });

  it("spreads three objects evenly between the first and last edges (horizontal)", () => {
    // Span 0..120, three 20-wide boxes. total width = 60, free = 120-60 = 60,
    // gap = 60 / (3-1) = 30. Positions: 0, 0+20+30=50, 50+20+30=100.
    const a = obj(0, 0, 20, 10);
    const mid = obj(40, 0, 20, 10);
    const c = obj(100, 0, 20, 10);
    distributeObjects(canvasWith([a, mid, c]), "horizontal");
    expect(a.left).toBe(0);
    expect(mid.left).toBe(50);
    expect(c.left).toBe(100);
  });

  it("spreads three objects evenly on the vertical axis", () => {
    const a = obj(0, 0, 10, 20);
    const mid = obj(0, 30, 10, 20);
    const c = obj(0, 100, 10, 20);
    // last edge = 100+20 = 120, total = 60, gap = (120-0-60)/2 = 30.
    distributeObjects(canvasWith([a, mid, c]), "vertical");
    expect(a.top).toBe(0);
    expect(mid.top).toBe(50);
    expect(c.top).toBe(100);
  });

  it("keeps the first and last object pinned to their original extents", () => {
    const a = obj(10, 0, 20, 10);
    const mid = obj(50, 0, 20, 10);
    const c = obj(200, 0, 20, 10);
    distributeObjects(canvasWith([a, mid, c]), "horizontal");
    // First stays at its original left; last keeps its original right edge.
    expect(a.left).toBe(10);
    expect(c.left + c.getScaledWidth()).toBe(220);
  });
});
