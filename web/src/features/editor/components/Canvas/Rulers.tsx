"use client";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

const TICK = 100; // label every 100 slide-units

function ticks(length: number): number[] {
  const out: number[] = [];
  for (let v = 0; v <= length; v += TICK) out.push(v);
  return out;
}

/**
 * Decorative horizontal ruler. Spans the canvas width and shows
 * approximate tick labels (0, 100, 200, ...) across the slide width.
 */
export function RulerHorizontal() {
  return (
    <div className="relative h-5 w-full overflow-hidden border-b border-border bg-surface-muted">
      {ticks(SLIDE_WIDTH).map((v) => (
        <div
          key={v}
          className="absolute top-0 flex h-full flex-col items-start"
          style={{ left: `${(v / SLIDE_WIDTH) * 100}%` }}
        >
          <span className="h-1.5 w-px bg-content-tertiary/50" />
          <span className="ml-0.5 text-[8px] leading-none text-content-tertiary">{v}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Decorative vertical ruler. Spans the canvas height and shows
 * approximate tick labels (0, 100, 200, ...) down the slide height.
 */
export function RulerVertical() {
  return (
    <div className="relative h-full w-5 overflow-hidden border-r border-border bg-surface-muted">
      {ticks(SLIDE_HEIGHT).map((v) => (
        <div
          key={v}
          className="absolute left-0 flex w-full items-start"
          style={{ top: `${(v / SLIDE_HEIGHT) * 100}%` }}
        >
          <span className="h-px w-1.5 bg-content-tertiary/50" />
          <span className="ml-0.5 text-[8px] leading-none text-content-tertiary">{v}</span>
        </div>
      ))}
    </div>
  );
}
