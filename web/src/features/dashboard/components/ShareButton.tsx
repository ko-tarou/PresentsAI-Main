"use client";
import { useState } from "react";
import { ShareModal } from "./ShareModal";

interface ShareButtonProps {
  presentationId: string;
  presentationTitle: string;
}

export function ShareButton({ presentationId, presentationTitle }: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        🔗 共有
      </button>
      {open && (
        <ShareModal
          presentationId={presentationId}
          presentationTitle={presentationTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
