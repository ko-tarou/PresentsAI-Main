import { Canvas, IText, Textbox } from "fabric";
// Note: Textbox extends IText in Fabric v6 but is not assignable via return-type covariance

export interface TextOptions {
  left?: number;
  top?: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontWeight?: string;
  fontStyle?: string;
  underline?: boolean;
  textAlign?: string;
  width?: number;
}

export function addText(canvas: Canvas, text = "テキストを入力", opts: TextOptions = {}): Textbox {
  const obj = new Textbox(text, {
    left: opts.left ?? 100,
    top: opts.top ?? 100,
    fontSize: opts.fontSize ?? 24,
    fontFamily: opts.fontFamily ?? "sans-serif",
    fill: opts.fill ?? "#000000",
    fontWeight: opts.fontWeight ?? "normal",
    fontStyle: opts.fontStyle ?? "normal",
    underline: opts.underline ?? false,
    textAlign: opts.textAlign ?? "left",
    width: opts.width ?? 400,
    editable: true,
  });
  canvas.add(obj);
  canvas.setActiveObject(obj);
  obj.enterEditing();
  canvas.renderAll();
  return obj;
}

export function applyTextFormat(
  canvas: Canvas,
  format: Partial<{
    fontSize: number;
    fontFamily: string;
    fill: string;
    fontWeight: string;
    fontStyle: string;
    underline: boolean;
    linethrough: boolean;
    textAlign: string;
    lineHeight: number;
    charSpacing: number;
    textBackgroundColor: string;
  }>
) {
  const obj = canvas.getActiveObject();
  if (!obj || !(obj instanceof IText)) return;
  obj.set(format as Partial<IText>);
  canvas.requestRenderAll();
}
