export type TransitionType = "none"|"fade"|"slide-left"|"slide-right"|"zoom";

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
