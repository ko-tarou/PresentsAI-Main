"use client";
import { useState } from "react";

export function ShareButton({ presentationId }: { presentationId: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const viewUrl = `${origin}/view/${presentationId}`;
  const presentUrl = `${origin}/present/${presentationId}`;

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
        🔗 共有
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-10 rounded-xl border bg-white shadow-lg p-4 w-72 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">閲覧リンク（認証不要）</p>
            <div className="flex gap-2">
              <input value={viewUrl} readOnly className="flex-1 rounded border px-2 py-1 text-xs bg-gray-50" />
              <button onClick={() => copy(viewUrl)}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">
                {copied ? "✓" : "コピー"}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">プレゼンターリンク</p>
            <div className="flex gap-2">
              <input value={presentUrl} readOnly className="flex-1 rounded border px-2 py-1 text-xs bg-gray-50" />
              <button onClick={() => copy(presentUrl)}
                className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700">
                {copied ? "✓" : "コピー"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
