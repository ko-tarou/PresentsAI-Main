import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import {
  PresenceManager,
  PRESENCE_FIELD,
  colorForClient,
} from "./presence";

/**
 * Two clients in a room. We relay awareness updates between them exactly like
 * the collab server does (verbatim, no interpretation) by re-encoding the full
 * state of one side and applying it to the other.
 */
function link(a: Awareness, b: Awareness): void {
  const relay = (from: Awareness, to: Awareness) =>
    (
      { added, updated, removed }: {
        added: number[];
        updated: number[];
        removed: number[];
      },
    ) => {
      // Mirror y-websocket: relay exactly the clients touched by this update,
      // so removals (null state on leave) propagate too — not just live states.
      const changed = [...added, ...updated, ...removed];
      const update = encodeAwarenessUpdate(from, changed);
      applyAwarenessUpdate(to, update, "remote");
    };
  a.on("update", relay(a, b));
  b.on("update", relay(b, a));
}

describe("PresenceManager", () => {
  it("publishes identity on construction", () => {
    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    const m = new PresenceManager(awareness, { name: "Alice", color: "#f00" });

    const local = awareness.getLocalState()?.[PRESENCE_FIELD];
    expect(local).toMatchObject({ name: "Alice", color: "#f00", slideId: null });
    expect(m.localState.selectedId).toBeNull();
  });

  it("derives a deterministic color when none is given", () => {
    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    const m = new PresenceManager(awareness, { name: "Bob" });
    expect(m.localState.color).toBe(colorForClient(awareness.clientID));
  });

  it("merges partial updates without clobbering identity", () => {
    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    const m = new PresenceManager(awareness, { name: "Alice", color: "#f00" });

    m.update({ slideId: "s1" });
    m.update({ selectedId: "obj-9" });

    expect(m.localState).toMatchObject({
      name: "Alice",
      color: "#f00",
      slideId: "s1",
      selectedId: "obj-9",
    });
  });

  it("surfaces a remote peer's presence and reflects updates", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const awA = new Awareness(docA);
    const awB = new Awareness(docB);
    link(awA, awB);

    const a = new PresenceManager(awA, { name: "Alice" });
    const b = new PresenceManager(awB, { name: "Bob" });

    a.update({ slideId: "s1", selectedId: "rect-1" });

    // Bob sees Alice (and only Alice) among remote states.
    const seenByBob = b.remoteStates();
    expect(seenByBob).toHaveLength(1);
    expect(seenByBob[0]).toMatchObject({
      clientId: awA.clientID,
      name: "Alice",
      slideId: "s1",
      selectedId: "rect-1",
    });

    // A peer never lists itself.
    expect(a.remoteStates().map((p) => p.clientId)).not.toContain(awA.clientID);
  });

  it("notifies onChange subscribers when a remote peer updates", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const awA = new Awareness(docA);
    const awB = new Awareness(docB);
    link(awA, awB);

    const a = new PresenceManager(awA, { name: "Alice" });
    new PresenceManager(awB, { name: "Bob" });

    let calls = 0;
    const off = a.onChange(() => {
      calls += 1;
    });
    awB.setLocalStateField(PRESENCE_FIELD, {
      name: "Bob",
      color: "#0f0",
      slideId: "s2",
      selectedId: null,
      cursor: null,
    });
    expect(calls).toBeGreaterThan(0);
    off();
  });

  it("clears local presence on destroy so peers drop it", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const awA = new Awareness(docA);
    const awB = new Awareness(docB);
    link(awA, awB);

    const a = new PresenceManager(awA, { name: "Alice" });
    const b = new PresenceManager(awB, { name: "Bob" });

    expect(b.remoteStates()).toHaveLength(1);
    a.destroy();
    expect(b.remoteStates()).toHaveLength(0);
  });
});
