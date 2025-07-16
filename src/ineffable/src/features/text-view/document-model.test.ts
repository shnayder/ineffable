import { describe, it, expect, beforeEach } from "vitest";
import { DocumentModel } from "./document-model";
import { createDocStore } from "./document-store";

describe("DocumentModel", () => {
  let store: ReturnType<typeof createDocStore>;
  let model: DocumentModel;

  beforeEach(() => {
    store = createDocStore();
    model = new DocumentModel(store);
  });

  it("should initialize with empty store and create root element", () => {
    expect(store.getState().currentVersionNumber).not.toBeNull();
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
    const root = model.getRootElement();
    expect(root).toBeDefined();
    expect(root.kind).toBe("document");
    expect(root.contents).toBe("");
    expect(root.childrenIds).toHaveLength(0);
    // update it with some text
    model.updateElement(root.id, "A B.\n\nC D. E F.");
    // check that it has been parsed correctly
    const updatedRoot = model.getRootElement();
    expect(updatedRoot.id).not.toEqual(root.id);
    expect(updatedRoot.childrenIds.length).toBe(2);
    const para1 = model.getElement(updatedRoot.childrenIds[0]);
    const para2 = model.getElement(updatedRoot.childrenIds[1]);
    expect(para1.kind).toBe("paragraph");
    expect(para1.childrenIds.length).toBe(1);
    expect(para2.kind).toBe("paragraph");
    expect(para2.childrenIds.length).toBe(2);
    const sentence1 = model.getElement(para1.childrenIds[0]);
    expect(sentence1.kind).toBe("sentence");
    expect(sentence1.childrenIds.length).toBe(2);
    const word1 = model.getElement(sentence1.childrenIds[0]);
    const word2 = model.getElement(sentence1.childrenIds[1]);
    expect(word1.kind).toBe("word");
    expect(word1.contents).toBe("A");
    expect(word2.kind).toBe("word");
    expect(word2.contents).toBe("B.");

    const sentence2 = model.getElement(para2.childrenIds[0]);
    expect(sentence2.kind).toBe("sentence");
    expect(sentence2.childrenIds.length).toBe(2);
    const word3 = model.getElement(sentence2.childrenIds[0]);
    const word4 = model.getElement(sentence2.childrenIds[1]);
    expect(word3.kind).toBe("word");
    expect(word3.contents).toBe("C");
    expect(word4.kind).toBe("word");
    expect(word4.contents).toBe("D.");

    const sentence3 = model.getElement(para2.childrenIds[1]);
    expect(sentence3.kind).toBe("sentence");
    expect(sentence3.childrenIds.length).toBe(2);
    const word5 = model.getElement(sentence3.childrenIds[0]);
    const word6 = model.getElement(sentence3.childrenIds[1]);
    expect(word5.kind).toBe("word");
    expect(word5.contents).toBe("E");
    expect(word6.kind).toBe("word");
    expect(word6.contents).toBe("F.");
  });

  it("update word", () => {
    // (relies on above tests to ensure initialization works properly)
    // initialize
    model.updateElement(model.getRootElement().id, "A B.\n\nC D. E F.");

    // get the new root
    const root = model.getRootElement();

    // get our hands on the E
    const para2 = model.getElement(root.childrenIds[1]);
    const sentenceEF = model.getElement(para2.childrenIds[1]);
    const wordE = model.getElement(sentenceEF.childrenIds[0]);

    // also get other elements that should not change
    const sentenceCD = model.getElement(para2.childrenIds[0]);
    const para1 = model.getElement(root.childrenIds[0]);
    const wordF = model.getElement(sentenceEF.childrenIds[1]);

    // update E -> X
    model.updateElement(wordE.id, "X");

    // check that we have a new word element, a new sentence, a new paragraph, and a new root
    const updatedRoot = model.getRootElement();
    expect(updatedRoot.id).not.toEqual(root.id);
    expect(updatedRoot.childrenIds.length).toBe(2);
    // the first paragraph should be unchanged
    const updatedPara1 = model.getElement(updatedRoot.childrenIds[0]);
    expect(updatedPara1.id).toEqual(para1.id);
    // the second paragraph should be new
    const updatedPara2 = model.getElement(updatedRoot.childrenIds[1]);
    expect(updatedPara2.id).not.toEqual(para2.id);
    expect(updatedPara2.childrenIds.length).toBe(2);
    // the first sentence should be unchanged
    const updatedSentenceCD = model.getElement(updatedPara2.childrenIds[0]);
    expect(updatedSentenceCD.id).toEqual(sentenceCD.id);
    // the second sentence should be new
    const updatedSentenceEF = model.getElement(updatedPara2.childrenIds[1]);
    expect(updatedSentenceEF.id).not.toEqual(sentenceEF.id);
    expect(updatedSentenceEF.childrenIds.length).toBe(2);
    // the first word should be the new one
    const updatedWordE = model.getElement(updatedSentenceEF.childrenIds[0]);
    expect(updatedWordE.id).not.toEqual(wordE.id);
    expect(updatedWordE.contents).toBe("X");
    // the second word should be unchanged
    const updatedWordF = model.getElement(updatedSentenceEF.childrenIds[1]);
    expect(updatedWordF.id).toEqual(wordF.id);
    expect(updatedWordF.contents).toBe("F.");
  });
});
