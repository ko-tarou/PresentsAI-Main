import pptxgen from "pptxgenjs";
import type { Canvas } from "fabric";
export async function exportToPPTX(canvas: Canvas, title="presentation"): Promise<void> {
  const pptx = new pptxgen();
  pptx.defineLayout({ name:"SLIDE_16x9", width:10, height:5.625 });
  pptx.layout="SLIDE_16x9";
  const slide = pptx.addSlide();
  const dataURL = canvas.toDataURL({ format:"png", multiplier:1 });
  slide.addImage({ data:dataURL, x:0,y:0, w:"100%",h:"100%" });
  await pptx.writeFile({ fileName:`${title}.pptx` });
}
