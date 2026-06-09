"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@shared/components/ui";
import { ShareModal } from "./ShareModal";

interface ShareButtonProps {
  presentationId: string;
  presentationTitle: string;
}

export function ShareButton({ presentationId, presentationTitle }: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Share2 className="h-3.5 w-3.5" />
        共有
      </Button>
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
