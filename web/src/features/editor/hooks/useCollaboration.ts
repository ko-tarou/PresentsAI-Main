"use client";
import { useEffect, useRef } from "react";
import { CollabProvider } from "@lib/collab/provider";

/**
 * Minimal collaboration wiring for PR1: opens a y-websocket room for the given
 * presentation and holds a reference to the shared Yjs doc. Fabric two-way
 * binding (PR3) and awareness (PR5) are intentionally not wired up yet.
 *
 * @returns the live {@link CollabProvider} (or null before connect), so callers
 *          can reach the shared doc / slide array.
 */
export function useCollaboration(presentationId: string | null) {
  const providerRef = useRef<CollabProvider | null>(null);

  useEffect(() => {
    if (!presentationId) return;
    const provider = new CollabProvider(presentationId);
    provider.connect();
    providerRef.current = provider;
    return () => {
      provider.destroy();
      providerRef.current = null;
    };
  }, [presentationId]);

  return { provider: providerRef.current };
}
