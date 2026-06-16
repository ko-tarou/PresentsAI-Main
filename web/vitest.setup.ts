import "@testing-library/jest-dom/vitest";

// --- Canvas 2D context stub -------------------------------------------------
// A few unit tests (e.g. src/lib/collab/fabricAdapter.test.ts) construct a real
// Fabric.js Canvas, whose constructor calls HTMLCanvasElement.getContext("2d").
// jsdom only implements getContext when the native `canvas` npm package is
// present. That package needs a compiled cairo backend, which is not reliably
// available on CI runners (no system libs / no matching prebuild), so getContext
// returned null and Fabric threw "Cannot read properties of null (reading
// 'scale')".
//
// These tests exercise object reconciliation / serialization logic, not pixel
// output, so a no-op 2D context is sufficient and — unlike the native package —
// is deterministic and needs no native build. We install it unconditionally so
// local and CI behave identically.
const canvasProto = HTMLCanvasElement.prototype as unknown as {
  getContext: (contextId: string) => unknown;
  toDataURL: () => string;
};

const noop = () => {};

function makeContext2D(canvas: HTMLCanvasElement) {
  // Backing object with the few methods Fabric reads a return value from.
  const base: Record<string, unknown> = {
    canvas,
    measureText: () => ({ width: 0 }),
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => ({}),
    getContextAttributes: () => ({ willReadFrequently: false, alpha: true }),
    isPointInPath: () => false,
    isPointInStroke: () => false,
  };
  // Every other property (drawImage, save, restore, scale, setTransform, fillRect,
  // beginPath, ...) is a no-op getter so any draw call silently succeeds and any
  // read of a numeric style property returns a benign value.
  return new Proxy(base, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      // Fabric reads some style props (e.g. globalAlpha, lineWidth); return 1.
      return noop;
    },
    set() {
      return true;
    },
  });
}

canvasProto.getContext = function (this: HTMLCanvasElement, contextId: string) {
  if (contextId === "2d") return makeContext2D(this);
  return null;
};
canvasProto.toDataURL = function () {
  return "data:image/png;base64,";
};
