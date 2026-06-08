"use client";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { CollabProvider } from "@lib/collab/provider";

/**
 * Opens a y-websocket room for the given presentation and exposes the shared
 * Yjs doc reactively, so callers (the Fabric two-way binding, PR3) can bind to
 * it once it exists. Awareness (PR5) is still out of scope.
 *
 * @returns the live {@link CollabProvider} and its shared {@link Y.Doc} (both
 *          null before connect), kept in state so consumers re-render on connect.
 */
export function useCollaboration(presentationId: string | null, token: string | null = null) {
  const [provider, setProvider] = useState<CollabProvider | null>(null);
  const [doc, setDoc] = useState<Y.Doc | null>(null);

  useEffect(() => {
    if (!presentationId) return;
    const p = new CollabProvider(presentationId, new Y.Doc(), token);
    p.connect();
    setProvider(p);
    setDoc(p.doc);
    return () => {
      p.destroy();
      setProvider(null);
      setDoc(null);
    };
  }, [presentationId, token]);

  return { provider, doc };
}
