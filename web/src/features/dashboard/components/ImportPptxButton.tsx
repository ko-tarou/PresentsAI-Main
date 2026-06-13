"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useAuthStore } from "@features/dashboard/stores/authStore";
import { importPptxAsPresentation } from "@lib/import/importPresentation";
import { Button } from "@shared/components/ui/Button";

/**
 * Dashboard entry point for "import an existing PowerPoint as an editable deck".
 *
 * Picks a .pptx, parses it into editable slide objects, creates a presentation
 * with one slide per PPTX slide, then opens the editor. Unsupported elements
 * are reported via a non-blocking warning summary.
 */
export function ImportPptxButton() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("PPTXインポート");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !accessToken || busy) return;
    if (!file.name.toLowerCase().endsWith(".pptx")) {
      alert(".pptx ファイルを選択してください。");
      return;
    }
    setBusy(true);
    try {
      const res = await importPptxAsPresentation(accessToken, file, {
        onProgress: (p) => setLabel(p.label),
      });
      if (res.warnings.length > 0) {
        alert(
          `インポートが完了しました（${res.slideCount} スライド）。\n` +
            `一部の要素はスキップされました:\n- ` +
            Array.from(new Set(res.warnings)).join("\n- "),
        );
      }
      router.push(`/editor/${res.presentationId}`);
    } catch (err) {
      alert(`インポートに失敗しました: ${(err as Error).message}`);
    } finally {
      setBusy(false);
      setLabel("PPTXインポート");
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="secondary"
        size="md"
        onClick={() => inputRef.current?.click()}
        loading={busy}
      >
        <Upload className="h-4 w-4" />
        {label}
      </Button>
    </>
  );
}
