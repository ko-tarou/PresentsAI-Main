import jsPDF from "jspdf";
import type { Canvas } from "fabric";
export async function exportToPDF(canvas: Canvas, title="presentation"): Promise<void> {
  const dataURL = canvas.toDataURL({ format:"png", multiplier:2 });
  const pdf = new jsPDF({ orientation:"landscape", unit:"px", format:[1280,720] });
  pdf.addImage(dataURL,"PNG",0,0,1280,720);
  pdf.save(`${title}.pdf`);
}
