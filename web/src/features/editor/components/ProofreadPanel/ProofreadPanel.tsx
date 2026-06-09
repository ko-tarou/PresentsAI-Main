"use client";
import { useState, useCallback } from "react";
import { SpellCheck, Check, RotateCw } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import {
  extractSlideText,
  proofreadText,
  applySuggestion,
  type ProofreadSuggestion,
} from "@lib/ai/proofread";

type Status = "idle" | "loading" | "error" | "done";

// AI proofreading panel. Runs the slide's text through the LFM2 gateway
// (via @lib/ai/proofread) and lists誤字脱字/表現改善の提案. Each suggestion can be
// applied to the canvas in place. Mirrors the CommentsPanel side-panel layout.
export function ProofreadPanel() {
  const canvas = useEditorStore((s) => s.canvas);
  const [status, setStatus] = useState<Status>("idle");
  const [suggestions, setSuggestions] = useState<ProofreadSuggestion[]>([]);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  const run = useCallback(async () => {
    setStatus("loading");
    setSuggestions([]);
    setApplied(new Set());
    try {
      const text = extractSlideText(canvas);
      const result = await proofreadText(text);
      setSuggestions(result);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, [canvas]);

  const apply = useCallback(
    (index: number) => {
      const s = suggestions[index];
      if (!s) return;
      if (applySuggestion(canvas, s)) {
        setApplied((prev) => new Set(prev).add(index));
      }
    },
    [canvas, suggestions],
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l bg-white">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <SpellCheck className="h-3.5 w-3.5 text-blue-600" />
          AI 校正
        </p>
        {status === "loading" && (
          <span className="text-xs text-gray-400">解析中...</span>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {status === "idle" && (
          <p className="text-xs text-gray-400">
            「校正する」で現在のスライドの誤字脱字・表現をチェックします。
          </p>
        )}
        {status === "error" && (
          <p className="text-xs text-red-500">
            AI サービスに接続できませんでした。しばらくして再試行してください。
          </p>
        )}
        {status === "done" && suggestions.length === 0 && (
          <p className="text-xs text-gray-400">修正の提案はありませんでした。</p>
        )}
        {suggestions.map((s, i) => {
          const isApplied = applied.has(i);
          return (
            <div key={`${s.original}-${i}`} className="rounded-lg border bg-gray-50 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                  {s.reason}
                </span>
              </div>
              <p className="text-xs text-gray-400 line-through break-words">
                {s.original}
              </p>
              <p className="text-xs font-medium text-gray-800 break-words">
                {s.suggestion}
              </p>
              <button
                onClick={() => apply(i)}
                disabled={isApplied}
                className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-green-600 disabled:opacity-100"
              >
                {isApplied ? (
                  <>
                    <Check className="h-3 w-3" /> 適用済み
                  </>
                ) : (
                  "適用"
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t p-3">
        <button
          onClick={run}
          disabled={status === "loading"}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${status === "loading" ? "animate-spin" : ""}`} />
          {status === "loading" ? "校正中..." : "校正する"}
        </button>
      </div>
    </aside>
  );
}
