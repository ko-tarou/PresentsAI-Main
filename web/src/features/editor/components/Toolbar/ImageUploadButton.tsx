"use client";
import { useRef } from "react";
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
        className="flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-blue-50 hover:ring-1 hover:ring-blue-300"
        title="画像を追加"
      >
        🖼️
      </button>
    </>
  );
}
