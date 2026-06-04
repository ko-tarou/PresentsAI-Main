import type { Canvas, FabricObject } from "fabric";

export type TransitionType = "none"|"fade"|"slide-left"|"slide-right"|"zoom";

export type EntranceType = "fade-in"|"fly-in-left"|"bounce";

// Animate a single object as an entrance preview on the canvas.
// Restores the object's original properties when done so it is non-destructive.
export async function animateEntrance(
  canvas: Canvas, obj: FabricObject, type: EntranceType, duration = 600,
): Promise<void> {
  const targetLeft = obj.left ?? 0;
  const targetOpacity = obj.opacity ?? 1;
  const targetScaleX = obj.scaleX ?? 1;
  const targetScaleY = obj.scaleY ?? 1;
  const render = () => canvas.requestRenderAll();

  if (type === "fade-in") {
    obj.set("opacity", 0);
    render();
    obj.animate({ opacity: targetOpacity }, { duration, onChange: render });
  } else if (type === "fly-in-left") {
    obj.set("left", targetLeft - canvas.getWidth());
    render();
    obj.animate({ left: targetLeft }, { duration, easing: easeOutCubic, onChange: render });
  } else if (type === "bounce") {
    obj.set({ scaleX: targetScaleX * 0.2, scaleY: targetScaleY * 0.2 });
    render();
    obj.animate(
      { scaleX: targetScaleX, scaleY: targetScaleY },
      { duration, easing: easeOutBounce, onChange: render },
    );
  }
  await delay(duration);
}

// Fabric easing functions take (t, b, c, d): time, begin, change, duration.
function easeOutCubic(t: number, b: number, c: number, d: number): number {
  const p = t / d - 1;
  return c * (p * p * p + 1) + b;
}

function easeOutBounce(t: number, b: number, c: number, d: number): number {
  let x = t / d;
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) x = n1 * x * x;
  else if (x < 2 / d1) x = n1 * (x -= 1.5 / d1) * x + 0.75;
  else if (x < 2.5 / d1) x = n1 * (x -= 2.25 / d1) * x + 0.9375;
  else x = n1 * (x -= 2.625 / d1) * x + 0.984375;
  return c * x + b;
}

export async function playTransition(el: HTMLElement, type: TransitionType, dur=400): Promise<void> {
  if (type==="none") return;
  const s=el.style;
  if (type==="fade") {
    s.transition=`opacity ${dur}ms ease`; s.opacity="0";
    await delay(dur/2); s.opacity="1";
  } else if (type==="slide-left") {
    s.transition=`transform ${dur}ms ease`; s.transform="translateX(-100%)";
    await delay(dur/2); s.transform="translateX(0)";
  } else if (type==="slide-right") {
    s.transition=`transform ${dur}ms ease`; s.transform="translateX(100%)";
    await delay(dur/2); s.transform="translateX(0)";
  } else if (type==="zoom") {
    s.transition=`transform ${dur}ms ease,opacity ${dur}ms ease`; s.transform="scale(0.8)"; s.opacity="0";
    await delay(dur/2); s.transform="scale(1)"; s.opacity="1";
  }
  await delay(dur/2);
  s.transition=s.transform=s.opacity="";
}

function delay(ms: number) { return new Promise<void>(r=>setTimeout(r,ms)); }
