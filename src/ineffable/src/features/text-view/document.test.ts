import { describe, it, expect } from "vitest";
import { createDocumentModelFromText } from "./document";
import type { Element } from "./types";

describe("DocumentModel / createDocumentModelFromText", () => {
  it("empty string produces doc with single root element", () => {
    const doc = createDocumentModelFromText("");
    const root = doc.root;
    expect(root.kind).toBe("document");
    expect(root.childrenIds).toHaveLength(0);
  });

  it(`'Hi.' produces document → paragraph → sentence → word`, () => {
    const doc = createDocumentModelFromText("Hi.");
    const root = doc.root;
    // one paragraph
    expect(root.childrenIds).toHaveLength(1);
    const para = doc.getElementById(root.childrenIds![0]) as Element;
    expect(para.kind).toBe("paragraph");
    // one sentence
    expect(para.childrenIds).toHaveLength(1);
    const sent = doc.getElementById(para.childrenIds![0]) as Element;
    expect(sent.kind).toBe("sentence");
    // one word
    expect(sent.childrenIds).toHaveLength(1);
    const word = doc.getElementById(sent.childrenIds![0]) as Element;
    expect(word.kind).toBe("word");
    expect((word as any).contents).toBe("Hi.");
  });

  it("multiple paragraphs & sentences are all nested correctly", () => {
    const raw = "A. B.\nC? D!";
    const doc = createDocumentModelFromText(raw);
    const root = doc.root;
    // two paragraphs
    expect(root.childrenIds).toHaveLength(2);

    // first paragraph has 2 sentences
    const [p1Id, p2Id] = root.childrenIds!;
    const p1 = doc.getElementById(p1Id)!;
    const p2 = doc.getElementById(p2Id)!;
    expect(p1.kind).toBe("paragraph");
    expect(p2.kind).toBe("paragraph");
    expect(p1.childrenIds).toHaveLength(2);
    expect(p2.childrenIds).toHaveLength(2);

    // each sentence has one word token (including punctuation)
    for (const para of [p1, p2]) {
      for (const sentId of para.childrenIds) {
        const sent = doc.getElementById(sentId)!;
        expect(sent.kind).toBe("sentence");
        expect(sent.childrenIds).toHaveLength(1);
        const w = doc.getElementById(sent.childrenIds[0])!;
        expect(w.kind).toBe("word");
        // text should match the raw token
        expect((w as any).contents).toBeDefined();
      }
    }
  });
});
