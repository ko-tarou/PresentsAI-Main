"use client";
import { useEffect, useRef, useState } from "react";
import type { Canvas } from "fabric";
import { CollabProvider } from "@lib/collab/provider";
import {
  PresenceManager,
  type RemotePresence,
} from "@lib/collab/presence";

/** A short, stable anonymous label for an unauthenticated/unnamed session. */
function anonName(clientId: number): string {
  return `ゲスト ${Math.abs(clientId) % 1000}`;
}

/**
 * Connects local editor state to the collaborative awareness channel and exposes
 * every other peer's presence reactively.
 *
 * Publishes: identity (name + color), current slide, selected object id, and the
 * pointer position (slide coordinates). Subscribes to remote awareness changes
 * and mirrors them into React state so overlays re-render. On unmount the manager
 * clears local presence so peers drop this client immediately (no 30s timeout).
 */
export function usePresence(
  provider: CollabProvider | null,
  canvas: Canvas | null,
  activeSlideId: string | null,
  identity?: { name?: string },
): { peers: RemotePresence[] } {
  const [peers, setPeers] = useState<RemotePresence[]>([]);
  const managerRef = useRef<PresenceManager | null>(null);

  // Build the manager once per connected provider.
  useEffect(() => {
    const awareness = provider?.awareness;
    if (!awareness) return;
    const name = identity?.name ?? anonName(awareness.clientID);
    const manager = new PresenceManager(awareness, { name });
    managerRef.current = manager;
    const unsubscribe = manager.onChange(() => setPeers(manager.remoteStates()));
    setPeers(manager.remoteStates());
    return () => {
      unsubscribe();
      manager.destroy();
      managerRef.current = null;
    };
  }, [provider, identity?.name]);

  // Publish the active slide whenever it (or the manager) changes. `provider`
  // is a dep so this re-runs right after a new manager is created on connect,
  // seeding the initial slide without an extra effect.
  useEffect(() => {
    managerRef.current?.update({ slideId: activeSlideId });
  }, [activeSlideId, provider]);

  // Track selection + pointer on the live canvas.
  useEffect(() => {
    const manager = managerRef.current;
    if (!canvas || !manager) return;

    const selectedId = () => {
      const obj = canvas.getActiveObject() as { id?: string } | undefined;
      return obj?.id ?? null;
    };
    const onSelection = () => manager.update({ selectedId: selectedId() });
    const onMove = (e: { scenePoint?: { x: number; y: number }; pointer?: { x: number; y: number } }) => {
      const p = e.scenePoint ?? e.pointer;
      if (p) manager.update({ cursor: { x: Math.round(p.x), y: Math.round(p.y) } });
    };

    canvas.on("selection:created", onSelection);
    canvas.on("selection:updated", onSelection);
    canvas.on("selection:cleared", onSelection);
    canvas.on("mouse:move", onMove);
    onSelection();
    return () => {
      canvas.off("selection:created", onSelection);
      canvas.off("selection:updated", onSelection);
      canvas.off("selection:cleared", onSelection);
      canvas.off("mouse:move", onMove);
    };
  }, [canvas]);

  return { peers };
}
