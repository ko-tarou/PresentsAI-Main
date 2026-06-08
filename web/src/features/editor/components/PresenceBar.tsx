"use client";
import type { RemotePresence } from "@lib/collab/presence";

/** First grapheme of a name, used as an avatar initial. */
function initial(name: string): string {
  return [...name][0] ?? "?";
}

/**
 * Compact participant strip for the editor header: one colored avatar per remote
 * peer, captioned with which slide they are on. Renders nothing when alone, so it
 * stays invisible in single-user editing.
 */
export function PresenceBar({
  peers,
  activeSlideId,
}: {
  peers: RemotePresence[];
  activeSlideId: string | null;
}) {
  if (peers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1.5" aria-label="共同編集者">
      {peers.map((p) => {
        const here = p.slideId === activeSlideId;
        const label = here
          ? `${p.name}（このスライド）`
          : `${p.name}（別のスライド）`;
        return (
          <span
            key={p.clientId}
            title={label}
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold text-white ring-1 ring-white/40"
            style={{
              backgroundColor: p.color,
              borderColor: here ? p.color : "transparent",
              opacity: here ? 1 : 0.45,
            }}
          >
            {initial(p.name)}
          </span>
        );
      })}
    </div>
  );
}
