import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editorStore";

describe("useEditorStore", () => {
  beforeEach(() => {
    useEditorStore.setState({
      canvas: null,
      activeTool: "select",
      activeSlideId: null,
      presentationId: null,
      isDirty: false,
      zoom: 1,
    });
  });

  it("setActiveTool updates the active tool", () => {
    useEditorStore.getState().setActiveTool("rect");
    expect(useEditorStore.getState().activeTool).toBe("rect");
  });

  it("setActiveSlide updates the active slide id", () => {
    useEditorStore.getState().setActiveSlide("slide-7");
    expect(useEditorStore.getState().activeSlideId).toBe("slide-7");
  });

  it("setPresentationId updates the presentation id", () => {
    useEditorStore.getState().setPresentationId("pres-42");
    expect(useEditorStore.getState().presentationId).toBe("pres-42");
  });

  it("setDirty toggles the dirty flag", () => {
    useEditorStore.getState().setDirty(true);
    expect(useEditorStore.getState().isDirty).toBe(true);
    useEditorStore.getState().setDirty(false);
    expect(useEditorStore.getState().isDirty).toBe(false);
  });

  it("setZoom updates the zoom level", () => {
    useEditorStore.getState().setZoom(1.5);
    expect(useEditorStore.getState().zoom).toBe(1.5);
  });

  it("toggleMembers flips the members panel visibility", () => {
    useEditorStore.setState({ showMembers: false });
    useEditorStore.getState().toggleMembers();
    expect(useEditorStore.getState().showMembers).toBe(true);
    useEditorStore.getState().toggleMembers();
    expect(useEditorStore.getState().showMembers).toBe(false);
  });

  it("setShowMembers sets the members panel visibility directly", () => {
    useEditorStore.getState().setShowMembers(true);
    expect(useEditorStore.getState().showMembers).toBe(true);
  });
});
