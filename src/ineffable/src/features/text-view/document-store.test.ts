import { describe, it, expect, beforeEach } from "vitest";
import { useDocStore } from "./document-store";
import { myNanoid } from "@/utils/nanoid";

// helper to reset store state while keeping methods
function resetStore() {
  useDocStore.setState((state) => ({
    ...state,
    elements: {},
    annotations: {},
    elementAnnotations: [],
    versions: {},
    currentVersionNumber: null,
    nextVersionNumber: 1,
  }));
}

describe("DocStore", () => {
  beforeEach(() => {
    resetStore();
  });

  it("adds single and multiple elements", () => {
    const id1 = myNanoid();
    const id2 = myNanoid();
    const id3 = myNanoid();

    const returnedId = useDocStore.getState().addElement({
      id: id1,
      kind: "word",
      contents: "hi",
      childrenIds: [],
    });
    expect(returnedId).toBe(id1);
    const el1 = useDocStore.getState().elements[id1];
    expect(el1).toBeDefined();
    expect(el1.createdAt).toBeInstanceOf(Date);

    const ids = useDocStore.getState().addElements([
      { id: id2, kind: "word", contents: "a", childrenIds: [] },
      { id: id3, kind: "word", contents: "b", childrenIds: [] },
    ]);
    expect(ids).toEqual([id2, id3]);
    expect(Object.keys(useDocStore.getState().elements)).toHaveLength(3);
  });

  it("creates annotations with mapping", () => {
    const elId = myNanoid();
    useDocStore.getState().addElement({
      id: elId,
      kind: "word",
      contents: "x",
      childrenIds: [],
    });
    useDocStore.setState((s) => ({ ...s, currentVersionNumber: 2 }));

    const annId = myNanoid();
    const ret = useDocStore.getState().addAnnotation(
      { id: annId, previousVersionId: "", kind: "comment", contents: "c", status: "open" },
      elId
    );
    expect(ret).toBe(annId);
    const ann = useDocStore.getState().annotations[annId];
    expect(ann).toBeDefined();
    const mapping = useDocStore.getState().elementAnnotations.find(
      (ea) => ea.annotationId === annId && ea.elementId === elId
    );
    expect(mapping).toBeDefined();
    expect(mapping!.validFromVersion).toBe(2);
  });

  it("updates annotation validity", () => {
    const eId = myNanoid();
    const aId = myNanoid();
    useDocStore.getState().addElement({ id: eId, kind: "word", contents: "y", childrenIds: [] });
    useDocStore.getState().addAnnotation(
      { id: aId, previousVersionId: "", kind: "comment", contents: "c", status: "open" },
      eId
    );
    useDocStore.getState().updateElementAnnotationValidity(eId, aId, 5);
    const mapping = useDocStore.getState().elementAnnotations.find(
      (ea) => ea.annotationId === aId && ea.elementId === eId
    );
    expect(mapping!.validThroughVersion).toBe(5);
  });

  it("manages versions", () => {
    const rootId = myNanoid();
    const ver = useDocStore.getState().addVersion(rootId);
    expect(ver).toBe(1);
    expect(useDocStore.getState().currentVersionNumber).toBe(1);
    expect(useDocStore.getState().versions[1].rootId).toBe(rootId);
    expect(useDocStore.getState().nextVersionNumber).toBe(2);

    useDocStore.getState().switchCurrentVersion(1);
    expect(useDocStore.getState().currentVersionNumber).toBe(1);
    expect(() => useDocStore.getState().switchCurrentVersion(99)).toThrow();
  });
});
