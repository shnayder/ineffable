import { describe, it, expect, beforeEach } from "vitest";
import { docModel } from "./document-model";
import { useDocStore } from "./document-store";

describe("DocumentModel", () => {
  let model: DocumentModel;

  beforeEach(() => {
    // Reset the store before each test
    useDocStore.setState({
      elements: {},
      versions: {},
      annotations: {},
      currentVersionNumber: null,
      nextVersionNumber: 0,
    });
    model = docModel;
  });

  it("should initialize with empty store and create root element", () => {
    const root = model.getElement(model._store.versions[0].rootId);
    expect(root).toBeDefined();
    expect(root!.kind).toBe("document");
    expect(root!.contents).toBe("");
    expect(root!.childrenIds).toHaveLength(0);
  });

  it("should update root with simple text and create proper hierarchy", () => {
    const rootId = model._store.versions[0].rootId;

    // Update the root document with text containing multiple sentences
    model.updateElement(rootId, "A B. C D. E.");

    // Get the new version (should be version 1 after update)
    const newVersion = model._store.versions[1];
    expect(newVersion).toBeDefined();

    const newRoot = model.getElement(newVersion.rootId);
    expect(newRoot).toBeDefined();
    expect(newRoot!.kind).toBe("document");

    // Should have one paragraph
    expect(newRoot!.childrenIds).toHaveLength(1);
    const paragraph = model.getElement(newRoot!.childrenIds[0]);
    expect(paragraph!.kind).toBe("paragraph");

    // Paragraph should have 3 sentences
    expect(paragraph!.childrenIds).toHaveLength(3);

    // Check first sentence: "A B."
    const sentence1 = model.getElement(paragraph!.childrenIds[0]);
    expect(sentence1!.kind).toBe("sentence");
    expect(sentence1!.childrenIds).toHaveLength(2); // "A" and "B."

    const word1_1 = model.getElement(sentence1!.childrenIds[0]);
    const word1_2 = model.getElement(sentence1!.childrenIds[1]);
    expect(word1_1!.kind).toBe("word");
    expect(word1_1!.contents).toBe("A");
    expect(word1_2!.kind).toBe("word");
    expect(word1_2!.contents).toBe("B.");

    // Check second sentence: "C D."
    const sentence2 = model.getElement(paragraph!.childrenIds[1]);
    expect(sentence2!.kind).toBe("sentence");
    expect(sentence2!.childrenIds).toHaveLength(2); // "C" and "D."

    const word2_1 = model.getElement(sentence2!.childrenIds[0]);
    const word2_2 = model.getElement(sentence2!.childrenIds[1]);
    expect(word2_1!.contents).toBe("C");
    expect(word2_2!.contents).toBe("D.");

    // Check third sentence: "E."
    const sentence3 = model.getElement(paragraph!.childrenIds[2]);
    expect(sentence3!.kind).toBe("sentence");
    expect(sentence3!.childrenIds).toHaveLength(1); // "E."

    const word3_1 = model.getElement(sentence3!.childrenIds[0]);
    expect(word3_1!.contents).toBe("E.");
  });

  it("should handle multiple paragraphs", () => {
    const rootId = model._store.versions[0].rootId;

    // Update with text containing multiple paragraphs
    model.updateElement(rootId, "First paragraph.\n\nSecond paragraph.");

    const newVersion = model._store.versions[1];
    const newRoot = model.getElement(newVersion.rootId);

    // Should have 2 paragraphs
    expect(newRoot!.childrenIds).toHaveLength(2);

    const para1 = model.getElement(newRoot!.childrenIds[0]);
    const para2 = model.getElement(newRoot!.childrenIds[1]);

    expect(para1!.kind).toBe("paragraph");
    expect(para2!.kind).toBe("paragraph");
    expect(para1!.contents).toBe("First paragraph.");
    expect(para2!.contents).toBe("Second paragraph.");
  });

  it("should update a single word", () => {
    const rootId = model._store.versions[0].rootId;

    // First, create a document with some text
    model.updateElement(rootId, "Hello world.");

    // Get a word element to update
    const version1 = model._store.versions[1];
    const root1 = model.getElement(version1.rootId);
    const para1 = model.getElement(root1!.childrenIds[0]);
    const sent1 = model.getElement(para1!.childrenIds[0]);
    const word1 = model.getElement(sent1!.childrenIds[0]); // "Hello"

    expect(word1!.contents).toBe("Hello");

    // Update the word
    model.updateElement(word1!.id, "Hi");

    // Check that a new version was created
    const version2 = model._store.versions[2];
    expect(version2).toBeDefined();

    // Traverse to the updated word and verify it changed
    const root2 = model.getElement(version2.rootId);
    const para2 = model.getElement(root2!.childrenIds[0]);
    const sent2 = model.getElement(para2!.childrenIds[0]);
    const word2 = model.getElement(sent2!.childrenIds[0]);

    expect(word2!.contents).toBe("Hi");
    expect(word2!.id).not.toBe(word1!.id); // Should be a new element
  });
});
