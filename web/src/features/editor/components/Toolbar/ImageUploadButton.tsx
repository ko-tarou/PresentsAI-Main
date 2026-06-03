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
        className="flex h-8 w-8 items-center justify-center rounded-lg text-content-secondary hover:bg-surface-muted hover:text-content-primary transition-colors"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
    </>
  );
}
