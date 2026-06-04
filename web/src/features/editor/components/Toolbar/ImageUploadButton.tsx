"use client";
import { useRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { uploadAndAddImage } from "@lib/fabric/tools/image";

export function ImageUploadButton() {
  const { canvas } = useEditorStore();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;
    try {
      await uploadAndAddImage(canvas, file);
    } catch (err) {
      console.error("Image upload failed:", err);
    }
    e.target.value = "";
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        onClick={() => inputRef.current?.click()}
        title="画像を追加"
        className="flex h-full min-w-14 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors"
      >
        <ImageIcon className="h-5 w-5" />
        <span className="text-[11px] leading-tight">画像</span>
      </button>
    </>
  );
}
