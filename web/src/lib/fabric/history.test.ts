import { vi, describe, it, expect, beforeEach } from "vitest";

// toJSON serializes whatever the fake canvas currently holds in `_state`.
vi.mock("./canvas", () => ({
  toJSON: (canvas: { _state: unknown }) => ({ snapshot: canvas._state }),
}));

import { HistoryManager } from "./history";

// Minimal fake canvas exposing only the surface HistoryManager touches:
// on(), loadFromJSON(), renderAll(), plus a mutable _state we control.
class FakeCanvas {
  _state: unknown = "init";
  private handlers: Record<string, Array<() => void>> = {};

  on(event: string, handler: () => void) {
    (this.handlers[event] ||= []).push(handler);
  }

  fire(event: string) {
    (this.handlers[event] || []).forEach((h) => h());
  }

  // Simulate a mutation then notify listeners like fabric would.
  mutate(newState: unknown, event = "object:added") {
    this._state = newState;
    this.fire(event);
  }

  loadFromJSON(json: { snapshot: unknown }) {
    this._state = json.snapshot;
    // Real fabric re-adds objects during load, firing object:added. The
    // HistoryManager relies on that event to consume its ignoreNextEvent flag.
    this.fire("object:added");
    return Promise.resolve(this);
  }

  renderAll() {}
}

function makeHistory() {
  const canvas = new FakeCanvas();
  // HistoryManager's constructor type expects a fabric Canvas; the fake only
  // implements the subset actually used, so cast through unknown.
  const history = new HistoryManager(canvas as unknown as never);
  return { canvas, history };
}

// restoreState() runs loadFromJSON().then(...), so state is applied on a
// microtask. Awaiting an empty resolved promise lets that microtask settle.
const flush = () => Promise.resolve();

describe("HistoryManager", () => {
  let canvas: FakeCanvas;
  let history: HistoryManager;

  beforeEach(() => {
    ({ canvas, history } = makeHistory());
  });

  it("cannot undo or redo right after construction (only initial state)", () => {
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("becomes undoable after a canvas change", () => {
    canvas.mutate("state-1");
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it("undo restores the previous state and enables redo", async () => {
    canvas.mutate("state-1");
    history.undo();
    await flush();
    expect(canvas._state).toBe("init");
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it("redo re-applies the undone state", async () => {
    canvas.mutate("state-1");
    history.undo();
    await flush();
    history.redo();
    await flush();
    expect(canvas._state).toBe("state-1");
    expect(history.canRedo()).toBe(false);
    expect(history.canUndo()).toBe(true);
  });

  it("undo is a no-op when there is nothing to undo", () => {
    expect(() => history.undo()).not.toThrow();
    expect(canvas._state).toBe("init");
  });

  it("redo is a no-op when there is nothing to redo", () => {
    canvas.mutate("state-1");
    expect(() => history.redo()).not.toThrow();
    expect(canvas._state).toBe("state-1");
  });

  it("does not push a duplicate state when nothing changed", () => {
    // mutate to same value as initial -> saveState should dedupe
    canvas.mutate("init");
    expect(history.canUndo()).toBe(false);
  });

  it("a new change after undo clears the redo (future) stack", async () => {
    canvas.mutate("state-1");
    canvas.mutate("state-2");
    history.undo();
    await flush();
    expect(history.canRedo()).toBe(true);
    canvas.mutate("state-3");
    expect(history.canRedo()).toBe(false);
  });
});
