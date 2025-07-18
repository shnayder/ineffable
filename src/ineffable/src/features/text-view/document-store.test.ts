import { describe, it, expect, beforeEach } from "vitest";
import { createDocStore } from "./document-store";
import { myNanoid } from "@/utils/nanoid";

// helper to reset store state while keeping methods
let store: ReturnType<typeof createDocStore>;

describe("DocStore", () => {
  beforeEach(() => {
    store = createDocStore();
  });

  it("adds single and multiple elements", () => {
    const id1 = myNanoid();
    const id2 = myNanoid();
    const id3 = myNanoid();

    const returnedId = store.getState().addElement({
      id: id1,
      kind: "word",
      contents: "hi",
      childrenIds: [],
      createdAt: new Date(),
    });
    expect(returnedId).toBe(id1);
    const el1 = store.getState().elements[id1];
    expect(el1).toBeDefined();
    expect(el1.createdAt).toBeInstanceOf(Date);

    const ids = store.getState().addElements([
      {
        id: id2,
        kind: "word",
        contents: "a",
        childrenIds: [],
        createdAt: new Date(),
      },
      {
        id: id3,
        kind: "word",
        contents: "b",
        childrenIds: [],
        createdAt: new Date(),
      },
    ]);
    expect(ids).toEqual([id2, id3]);
    expect(Object.keys(store.getState().elements)).toHaveLength(3);
  });

  it("throws when adding non-word element with contents", () => {
    expect(() =>
      store.getState().addElement({
        id: myNanoid(),
        kind: "sentence",
        contents: "nope",
        childrenIds: [],
        createdAt: new Date(),
      })
    ).toThrow();

    expect(() =>
      store.getState().addElements([
        {
          id: myNanoid(),
          kind: "paragraph",
          contents: "bad",
          childrenIds: [],
          createdAt: new Date(),
        },
      ])
    ).toThrow();
  });

  it("creates annotations with mapping", () => {
    const elId = myNanoid();
    store.getState().addElement({
      id: elId,
      kind: "word",
      contents: "x",
      childrenIds: [],
      createdAt: new Date(),
    });
    store.setState((s) => ({ ...s, currentVersionNumber: 2 }));

    const annId = myNanoid();
    const ret = store.getState().addAnnotation(
      {
        id: annId,
        previousVersionId: "",
        kind: "comment",
        contents: "c",
        status: "open",
        createdAt: new Date(),
      },
      elId
    );
    expect(ret).toBe(annId);
    const ann = store.getState().annotations[annId];
    expect(ann).toBeDefined();
    const mapping = store
      .getState()
      .elementAnnotations.find(
        (ea) => ea.annotationId === annId && ea.elementId === elId
      );
    expect(mapping).toBeDefined();
    expect(mapping!.validFromVersion).toBe(2);
  });

  it("updates annotation validity", () => {
    const eId = myNanoid();
    const aId = myNanoid();
    store
      .getState()
      .addElement({
        id: eId,
        kind: "word",
        contents: "y",
        childrenIds: [],
        createdAt: new Date(),
      });
    store.getState().addAnnotation(
      {
        id: aId,
        previousVersionId: "",
        kind: "comment",
        contents: "c",
        status: "open",
        createdAt: new Date(),
      },
      eId
    );
    store.getState().updateElementAnnotationValidity(eId, aId, 5);
    const mapping = store
      .getState()
      .elementAnnotations.find(
        (ea) => ea.annotationId === aId && ea.elementId === eId
      );
    expect(mapping!.validThroughVersion).toBe(5);
  });

  it("manages versions", () => {
    const rootId = myNanoid();
    const ver = store.getState().addVersion(rootId);
    expect(ver).toBe(1);
    expect(store.getState().currentVersionNumber).toBe(1);
    expect(store.getState().versions[1].rootId).toBe(rootId);
    expect(store.getState().nextVersionNumber).toBe(2);

    // Add another version
    const newRootId = myNanoid();
    const newVer = store.getState().addVersion(newRootId);
    expect(newVer).toBe(2);
    expect(store.getState().currentVersionNumber).toBe(2);
    expect(store.getState().versions[2].rootId).toBe(newRootId);
    expect(store.getState().nextVersionNumber).toBe(3);

    // Switch back to first version
    store.getState().switchCurrentVersion(1);
    expect(store.getState().currentVersionNumber).toBe(1);
    expect(store.getState().versions[1].rootId).toBe(rootId);

    expect(() => store.getState().switchCurrentVersion(99)).toThrow();
  });
});
