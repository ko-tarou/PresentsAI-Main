import { Canvas } from "fabric";
import { toJSON } from "./canvas";

export class HistoryManager {
  private past: string[] = [];
  private future: string[] = [];
  private canvas: Canvas;
  private maxHistory = 50;
  private ignoreNextEvent = false;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.saveState(); // initial state

    canvas.on("object:added", () => this.onCanvasChanged());
    canvas.on("object:modified", () => this.onCanvasChanged());
    canvas.on("object:removed", () => this.onCanvasChanged());
  }

  private onCanvasChanged() {
    if (this.ignoreNextEvent) { this.ignoreNextEvent = false; return; }
    this.saveState();
  }

  private saveState() {
    const state = JSON.stringify(toJSON(this.canvas));
    if (this.past[this.past.length - 1] === state) return;
    this.past.push(state);
    this.future = [];
    if (this.past.length > this.maxHistory) this.past.shift();
  }

  undo() {
    if (this.past.length <= 1) return;
    const current = this.past.pop()!;
    this.future.push(current);
    const prev = this.past[this.past.length - 1];
    this.restoreState(prev);
  }

  redo() {
    if (this.future.length === 0) return;
    const next = this.future.pop()!;
    this.past.push(next);
    this.restoreState(next);
  }

  private restoreState(state: string) {
    this.ignoreNextEvent = true;
    this.canvas.loadFromJSON(JSON.parse(state) as Record<string, unknown>).then(() => {
      this.canvas.renderAll();
    });
  }

  canUndo() { return this.past.length > 1; }
  canRedo() { return this.future.length > 0; }
}
