import { Canvas, FabricImage } from "fabric";

export async function addImageFromUrl(canvas: Canvas, url: string): Promise<FabricImage> {
  const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
  const maxDim = 400;
  const scale = Math.min(maxDim / (img.width ?? 400), maxDim / (img.height ?? 300));
  img.set({ left: 100, top: 100, scaleX: scale, scaleY: scale });
  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.renderAll();
  return img;
}

export async function uploadAndAddImage(canvas: Canvas, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/assets/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const { url } = await res.json() as { url: string };
  await addImageFromUrl(canvas, url);
}
