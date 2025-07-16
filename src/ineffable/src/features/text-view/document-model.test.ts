import { describe, it, expect, beforeEach } from "vitest";
import { DocumentModel } from "./document-model";
import { useDocStore } from "./document-store";

describe("DocumentModel", () => {
  let model: DocumentModel;

  beforeEach(() => {
    // Reset the store before each test
    const store = useDocStore.getState();
    useDocStore.setState((state) => ({
      ...state,
      elements: {},
      annotations: {},
      elementAnnotations: [],
      versions: {},
      currentVersionNumber: null,
      nextVersionNumber: 0,
    }));
    model = new DocumentModel();
    // DEBUGGING: why is this logging 'null'? Is the setState running async?
    console.log(
      "DocumentModel initialized " + model._store.currentVersionNumber
    );
  });

  it.only("should initialize with empty store and create root element", () => {
    expect(model._store.currentVersionNumber).not.toBeNull();
    expect(model.getRootElement()).toBeDefined();
  });

  it("can get root element", () => {
    const root = model.getRootElement();
    expect(root).toBeDefined();
    expect(root.kind).toBe("document");
    expect(root.contents).toBe("");
    expect(root.childrenIds).toHaveLength(0);
  });

  it("parses a sentence into word elements", () => {
    const ids = model._parseContentsToElements("Hello world", "sentence", []);
    expect(ids).toHaveLength(1);
    const sentence = model.getElement(ids[0]);
    expect(sentence.kind).toBe("sentence");
    expect(sentence.childrenIds).toHaveLength(2);
    const first = model.getElement(sentence.childrenIds[0]);
    const second = model.getElement(sentence.childrenIds[1]);
    expect(first.contents).toBe("Hello");
    expect(first.kind).toBe("word");
    expect(second.contents).toBe("world");
    expect(second.kind).toBe("word");
  });

  it("parses a document into paragraphs, sentences, and words", () => {
    const ids = model._parseContentsToElements(
      "A B.\n\nC D. E F.",
      "document",
      []
    );
    expect(ids).toHaveLength(1);
    const doc = model.getElement(ids[0]);
    expect(doc.kind).toBe("document");
    expect(doc.childrenIds.length).toBe(2);
    const para1 = model.getElement(doc.childrenIds[0]);
    const para2 = model.getElement(doc.childrenIds[1]);
    expect(para1.childrenIds.length).toBe(1);
    expect(para2.childrenIds.length).toBe(2);
  });

  it("initializes model from a string", () => {
    // get root element of empty model
    // update it with some text
    // check that it has been parsed correctly
  });
});
