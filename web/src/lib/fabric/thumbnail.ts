import type { Canvas } from "fabric";

export function generateThumbnail(canvas: Canvas): string {
  return canvas.toDataURL({ format: "jpeg", quality: 0.6, multiplier: 0.15 });
}

export async function uploadThumbnailDataURL(dataURL: string, slideId: string): Promise<string | null> {
  try {
    const blob = await (await fetch(dataURL)).blob();
    const formData = new FormData();
    formData.append("file", new File([blob], `thumb-${slideId}.jpg`, { type: "image/jpeg" }));
    const res = await fetch("/assets/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const { url } = await res.json() as { url: string };
    return url;
  } catch {
    return null;
  }
}
