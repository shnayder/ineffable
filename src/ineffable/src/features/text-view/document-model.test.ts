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
    const ids = model._parseContentsToElements("Hello world", "sentence");
    expect(ids).toHaveLength(1);
    const sentence = model.getElement(ids[0]);
    expect(sentence.kind).toBe("sentence");
    expect(sentence.contents).toBe("");
    expect(sentence.childrenIds).toHaveLength(2);
    const first = model.getElement(sentence.childrenIds[0]);
    const second = model.getElement(sentence.childrenIds[1]);
    expect(first.contents).toBe("Hello");
    expect(first.kind).toBe("word");
    expect(second.contents).toBe("world");
    expect(second.kind).toBe("word");
  });

  it("parses a document into paragraphs, sentences, and words", () => {
    const ids = model._parseContentsToElements("A B.\n\nC D. E F.", "document");
    expect(ids).toHaveLength(1);
    const doc = model.getElement(ids[0]);
    expect(doc.kind).toBe("document");
    expect(doc.contents).toBe("");
    expect(doc.childrenIds.length).toBe(2);
    const para1 = model.getElement(doc.childrenIds[0]);
    const para2 = model.getElement(doc.childrenIds[1]);
    expect(para1.contents).toBe("");
    expect(para2.contents).toBe("");
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
    expect(updatedRoot.contents).toBe("");
    expect(para1.contents).toBe("");
    expect(para2.contents).toBe("");
    expect(para1.kind).toBe("paragraph");
    expect(para1.childrenIds.length).toBe(1);
    expect(para2.kind).toBe("paragraph");
    expect(para2.childrenIds.length).toBe(2);
    const sentence1 = model.getElement(para1.childrenIds[0]);
    expect(sentence1.contents).toBe("");
    expect(sentence1.kind).toBe("sentence");
    expect(sentence1.childrenIds.length).toBe(2);
    const word1 = model.getElement(sentence1.childrenIds[0]);
    const word2 = model.getElement(sentence1.childrenIds[1]);
    expect(word1.kind).toBe("word");
    expect(word1.contents).toBe("A");
    expect(word2.kind).toBe("word");
    expect(word2.contents).toBe("B.");

    const sentence2 = model.getElement(para2.childrenIds[0]);
    expect(sentence2.contents).toBe("");
    expect(sentence2.kind).toBe("sentence");
    expect(sentence2.childrenIds.length).toBe(2);
    const word3 = model.getElement(sentence2.childrenIds[0]);
    const word4 = model.getElement(sentence2.childrenIds[1]);
    expect(word3.kind).toBe("word");
    expect(word3.contents).toBe("C");
    expect(word4.kind).toBe("word");
    expect(word4.contents).toBe("D.");

    const sentence3 = model.getElement(para2.childrenIds[1]);
    expect(sentence3.contents).toBe("");
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

  it("replace one word with two", () => {
    model.updateElement(model.getRootElement().id, "A B.\n\nC D. E F.");

    // get the new root
    const root = model.getRootElement();

    // get our hands on the E
    const para2 = model.getElement(root.childrenIds[1]);
    const sentenceEF = model.getElement(para2.childrenIds[1]);
    const wordE = model.getElement(sentenceEF.childrenIds[0]);

    model.updateElement(wordE.id, "X Y");

    // check that there are now three words in the second sentence of the second paragraph
    const updatedRoot = model.getRootElement();
    expect(updatedRoot.id).not.toEqual(root.id);
    expect(updatedRoot.childrenIds.length).toBe(2);
    const updatedPara2 = model.getElement(updatedRoot.childrenIds[1]);
    expect(updatedPara2.id).not.toEqual(para2.id);
    expect(updatedPara2.childrenIds.length).toBe(2);
    const updatedSentenceXYF = model.getElement(updatedPara2.childrenIds[1]);
    expect(updatedSentenceXYF.id).not.toEqual(sentenceEF.id);
    expect(updatedSentenceXYF.childrenIds.length).toBe(3);
    const updatedWordX = model.getElement(updatedSentenceXYF.childrenIds[0]);
    expect(updatedWordX.id).not.toEqual(wordE.id);
    expect(updatedWordX.contents).toBe("X");
    const updatedWordY = model.getElement(updatedSentenceXYF.childrenIds[1]);
    expect(updatedWordY.id).not.toEqual(wordE.id);
    expect(updatedWordY.contents).toBe("Y");
    const updatedWordF = model.getElement(updatedSentenceXYF.childrenIds[2]);
    expect(updatedWordF.contents).toBe("F.");
  });

  it("replace one sentence with two", () => {
    model.updateElement(model.getRootElement().id, "A B.\n\nC D. E F.");

    // get the new root
    const root = model.getRootElement();

    // get our hands on the C D.
    const para2 = model.getElement(root.childrenIds[1]);
    const sentenceCD = model.getElement(para2.childrenIds[0]);
    const sentenceEF = model.getElement(para2.childrenIds[1]);

    model.updateElement(sentenceCD.id, "X Y. Z W.");

    // check that there are now three sentences in the second paragraph
    const updatedRoot = model.getRootElement();
    expect(updatedRoot.childrenIds.length).toBe(2);
    const updatedPara2 = model.getElement(updatedRoot.childrenIds[1]);
    expect(updatedPara2.id).not.toEqual(para2.id);
    expect(updatedPara2.childrenIds.length).toBe(3);
    const updatedSentenceXY = model.getElement(updatedPara2.childrenIds[0]);
    expect(updatedSentenceXY.childrenIds.length).toBe(2);
    const updatedSentenceZW = model.getElement(updatedPara2.childrenIds[1]);
    expect(updatedSentenceZW.childrenIds.length).toBe(2);
    const updatedSentenceEF = model.getElement(updatedPara2.childrenIds[2]);
    expect(updatedSentenceEF.id).toEqual(sentenceEF.id);
  });

  it("replace one paragraph with two", () => {
    model.updateElement(model.getRootElement().id, "A B.\n\nC D. E F.");

    // get the new root
    const root = model.getRootElement();

    const para1 = model.getElement(root.childrenIds[0]);
    const para2 = model.getElement(root.childrenIds[1]);

    model.updateElement(para2.id, "X Y.\n\nZ W.");

    // check that there are now three paragraphs in the document
    const updatedRoot = model.getRootElement();
    expect(updatedRoot.childrenIds.length).toBe(3);
    const updatedPara1 = model.getElement(updatedRoot.childrenIds[0]);
    expect(updatedPara1.id).toEqual(para1.id);
    const updatedParaXY = model.getElement(updatedRoot.childrenIds[1]);
    expect(updatedParaXY.childrenIds.length).toBe(1);
    const updatedParaZW = model.getElement(updatedRoot.childrenIds[2]);
    expect(updatedParaZW.childrenIds.length).toBe(1);
  });

  it("computes full contents for non-leaf elements", () => {
    const text = "A B.\n\nC D. E F.";
    model.updateElement(model.getRootElement().id, text);

    const root = model.getRootElement();
    expect(model.computeFullContents(root.id)).toBe(text);

    const para2 = model.getElement(root.childrenIds[1]);
    const sentEF = model.getElement(para2.childrenIds[1]);
    expect(model.computeFullContents(para2.id)).toBe("C D. E F.");
    expect(model.computeFullContents(sentEF.id)).toBe("E F.");
  });

  it("reuses existing words when adding new ones", () => {
    const text = "A B.\n\nC D. E F.";
    model.updateElement(model.getRootElement().id, text);
    const root = model.getRootElement();
    const para2 = model.getElement(root.childrenIds[1]);
    const sentEF = model.getElement(para2.childrenIds[1]);
    const wordE = model.getElement(sentEF.childrenIds[0]);
    const wordF = model.getElement(sentEF.childrenIds[1]);

    // Replace E with E X
    model.updateElement(wordE.id, "E X");

    // Check that we reused the element for E
    const updatedRoot = model.getRootElement();
    const updatedPara2 = model.getElement(updatedRoot.childrenIds[1]);
    const updatedSentEXF = model.getElement(updatedPara2.childrenIds[1]);
    const updatedWordE = model.getElement(updatedSentEXF.childrenIds[0]);
    const updatedWordX = model.getElement(updatedSentEXF.childrenIds[1]);
    const updatedWordF = model.getElement(updatedSentEXF.childrenIds[2]);
    expect(updatedWordE.id).toEqual(wordE.id);
    expect(updatedWordE.contents).toBe("E");
    expect(updatedWordX.contents).toBe("X");
    expect(updatedWordF.id).toEqual(wordF.id);
    expect(updatedWordF.contents).toBe("F.");
  });

  it("reuses existing words only once", () => {
    const text = "A B.\n\nC D. E F.";
    model.updateElement(model.getRootElement().id, text);
    const root = model.getRootElement();
    const para2 = model.getElement(root.childrenIds[1]);
    const sentEF = model.getElement(para2.childrenIds[1]);
    const wordE = model.getElement(sentEF.childrenIds[0]);
    const wordF = model.getElement(sentEF.childrenIds[1]);

    // Replace E with E E E
    model.updateElement(wordE.id, "E E E");

    // Check that we reused the element for the first E, but not the others
    const updatedRoot = model.getRootElement();
    const updatedPara2 = model.getElement(updatedRoot.childrenIds[1]);
    const updatedSentEEEF = model.getElement(updatedPara2.childrenIds[1]);
    const updatedWordE = model.getElement(updatedSentEEEF.childrenIds[0]);
    const updatedWordE2 = model.getElement(updatedSentEEEF.childrenIds[1]);
    const updatedWordE3 = model.getElement(updatedSentEEEF.childrenIds[2]);
    const updatedWordF = model.getElement(updatedSentEEEF.childrenIds[3]);

    expect(updatedWordE.id).toEqual(wordE.id);
    expect(updatedWordE.contents).toBe("E");

    expect(updatedWordE2.id).not.toEqual(wordE.id);
    expect(updatedWordE2.contents).toBe("E");
    expect(updatedWordE3.id).not.toEqual(wordE.id);
    expect(updatedWordE3.contents).toBe("E");
    expect(updatedWordF.id).toEqual(wordF.id);
    expect(updatedWordF.contents).toBe("F.");
  });

  it("reuses existing sentences when adding new ones", () => {
    const text = "A B.\n\nC D. E F.";
    model.updateElement(model.getRootElement().id, text);
    const root = model.getRootElement();
    const para2 = model.getElement(root.childrenIds[1]);
    const sentEF = model.getElement(para2.childrenIds[1]);

    // Replace E F. with E F. X Y.
    model.updateElement(sentEF.id, "E F. X Y.");

    // Check that we reused the element for E F.
    const updatedRoot = model.getRootElement();
    const updatedPara2 = model.getElement(updatedRoot.childrenIds[1]);
    const updatedSentEF = model.getElement(updatedPara2.childrenIds[1]);
    expect(updatedSentEF.id).toEqual(sentEF.id);
  });

  it("reuses existing words editing sentence", () => {
    const text = "A B.\n\nC D. E F.";
    model.updateElement(model.getRootElement().id, text);
    const root = model.getRootElement();
    const para2 = model.getElement(root.childrenIds[1]);
    const sentEF = model.getElement(para2.childrenIds[1]);
    const wordE = model.getElement(sentEF.childrenIds[0]);
    const wordF = model.getElement(sentEF.childrenIds[1]);

    // Replace E F with E X.
    model.updateElement(sentEF.id, "E X.");

    // Check that we reused the element for E
    const updatedRoot = model.getRootElement();
    const updatedPara2 = model.getElement(updatedRoot.childrenIds[1]);
    const updatedSentEX = model.getElement(updatedPara2.childrenIds[1]);
    const updatedWordE = model.getElement(updatedSentEX.childrenIds[0]);
    const updatedWordX = model.getElement(updatedSentEX.childrenIds[1]);
    expect(updatedWordE.id).toEqual(wordE.id);
    expect(updatedWordE.contents).toBe("E");
    expect(updatedWordX.contents).toBe("X.");
  });

  it("deletes a word", () => {
    model.updateElement(model.getRootElement().id, "A B.");
    const root = model.getRootElement();
    const para = model.getElement(root.childrenIds[0]);
    const sent = model.getElement(para.childrenIds[0]);
    const wordA = model.getElement(sent.childrenIds[0]);

    model.deleteElement(wordA.id);

    const updatedRoot = model.getRootElement();
    const updatedPara = model.getElement(updatedRoot.childrenIds[0]);
    const updatedSent = model.getElement(updatedPara.childrenIds[0]);
    expect(updatedSent.childrenIds.length).toBe(1);
    const remaining = model.getElement(updatedSent.childrenIds[0]);
    expect(remaining.contents).toBe("B.");
  });

  it("deletes a sentence", () => {
    model.updateElement(model.getRootElement().id, "A B. C D.");
    const root = model.getRootElement();
    const para = model.getElement(root.childrenIds[0]);
    const firstSentence = model.getElement(para.childrenIds[0]);
    const secondSentence = model.getElement(para.childrenIds[1]);

    model.deleteElement(firstSentence.id);

    const updatedRoot = model.getRootElement();
    const updatedPara = model.getElement(updatedRoot.childrenIds[0]);
    expect(updatedPara.childrenIds.length).toBe(1);
    const remaining = model.getElement(updatedPara.childrenIds[0]);
    expect(remaining.id).toEqual(secondSentence.id);
  });

  describe("examples from docs", () => {
    it("1. 'E' -> 'F'", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "E");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const sent = model.getElement(para.childrenIds[0]);
      const wordE = model.getElement(sent.childrenIds[0]);

      model.updateElement(wordE.id, "F");

      const updatedRoot = model.getRootElement();
      const updatedPara = model.getElement(updatedRoot.childrenIds[0]);
      const updatedSent = model.getElement(updatedPara.childrenIds[0]);
      const newWord = model.getElement(updatedSent.childrenIds[0]);

      expect(newWord.id).not.toEqual(wordE.id);
      expect(newWord.contents).toBe("F");
    });

    it("2. 'E' -> 'E F'", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "E");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const sent = model.getElement(para.childrenIds[0]);
      const wordE = model.getElement(sent.childrenIds[0]);

      model.updateElement(wordE.id, "E F");

      const updatedRoot = model.getRootElement();
      const updatedPara = model.getElement(updatedRoot.childrenIds[0]);
      const updatedSent = model.getElement(updatedPara.childrenIds[0]);

      const w1 = model.getElement(updatedSent.childrenIds[0]);
      const w2 = model.getElement(updatedSent.childrenIds[1]);
      expect(w1.id).toEqual(wordE.id);
      expect(w2.contents).toBe("F");
    });

    it("3. 'E' -> 'E E'", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "E");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const sent = model.getElement(para.childrenIds[0]);
      const wordE = model.getElement(sent.childrenIds[0]);

      model.updateElement(wordE.id, "E E");

      const updatedRoot = model.getRootElement();
      const updatedPara = model.getElement(updatedRoot.childrenIds[0]);
      const updatedSent = model.getElement(updatedPara.childrenIds[0]);

      const w1 = model.getElement(updatedSent.childrenIds[0]);
      const w2 = model.getElement(updatedSent.childrenIds[1]);
      expect(w1.id).toEqual(wordE.id);
      expect(w2.id).not.toEqual(wordE.id);
    });

    it("4. 'Life is good.' -> 'Life is very good.'", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "Life is good.");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const sent = model.getElement(para.childrenIds[0]);
      const [wLife, wIs, wGood] = sent.childrenIds.map((id) =>
        model.getElement(id)
      );

      model.updateElement(sent.id, "Life is very good.");

      const updatedRoot = model.getRootElement();
      const updatedPara = model.getElement(updatedRoot.childrenIds[0]);
      const updatedSent = model.getElement(updatedPara.childrenIds[0]);
      expect(updatedSent.childrenIds.length).toBe(4);
      const [uwLife, uwIs, uwVery, uwGood] = updatedSent.childrenIds.map((id) =>
        model.getElement(id)
      );

      expect(uwLife.id).toEqual(wLife.id);
      expect(uwIs.id).toEqual(wIs.id);
      expect(uwVery.contents).toBe("very");
      expect(uwGood.id).toEqual(wGood.id);
    });

    it("5. 'Life is very good.' -> 'Life is very very good.'", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "Life is very good.");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const sent = model.getElement(para.childrenIds[0]);
      const [wLife, wIs, wVery, wGood] = sent.childrenIds.map((id) =>
        model.getElement(id)
      );

      model.updateElement(sent.id, "Life is very very good.");

      const updatedRoot = model.getRootElement();
      const updatedPara = model.getElement(updatedRoot.childrenIds[0]);
      const newSent = model.getElement(updatedPara.childrenIds[0]);
      const words = newSent.childrenIds.map((id) => model.getElement(id));
      expect(words[0].id).toEqual(wLife.id);
      expect(words[1].id).toEqual(wIs.id);
      expect(words[2].id).toEqual(wVery.id);
      expect(words[3].id).not.toEqual(wVery.id);
      expect(words[4].id).toEqual(wGood.id);
    });

    it("6. 'A B C.' -> 'C B A'", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "A B C");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const sent = model.getElement(para.childrenIds[0]);
      const [wA, wB, wC] = sent.childrenIds.map((id) => model.getElement(id));

      model.updateElement(sent.id, "C B A");

      const updatedRoot = model.getRootElement();
      const updatedPara = model.getElement(updatedRoot.childrenIds[0]);
      const newSent = model.getElement(updatedPara.childrenIds[0]);
      const words = newSent.childrenIds.map((id) => model.getElement(id));
      expect(words[0].id).not.toEqual(wA.id);
      expect(words[1].id).not.toEqual(wB.id);
      expect(words[2].id).not.toEqual(wC.id);
    });

    it("7. paragraph sentence reuse", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "Hello. Nice to meet you.");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const [sHello, sNice] = para.childrenIds.map((id) =>
        model.getElement(id)
      );

      model.updateElement(para.id, "Hello. How are you?");

      const newPara = model.getElement(model.getRootElement().childrenIds[0]);
      const [nHello, nHow] = newPara.childrenIds.map((id) =>
        model.getElement(id)
      );
      expect(nHello.id).toEqual(sHello.id);
      expect(nHow.id).not.toEqual(sNice.id);
    });

    it("8. reuse words inside changed sentence", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "Hello. Nice to meet you.");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const sNice = model.getElement(para.childrenIds[1]);
      const niceWords = sNice.childrenIds.map((cid) => model.getElement(cid));

      model.updateElement(para.id, "Hello. Very nice to meet you.");

      const newPara = model.getElement(model.getRootElement().childrenIds[0]);
      const newSent = model.getElement(newPara.childrenIds[1]);
      const words = newSent.childrenIds.map((cid) => model.getElement(cid));
      expect(words[2].id).toEqual(niceWords[1].id); // to
      expect(words[3].id).toEqual(niceWords[2].id); // meet
      expect(words[4].id).toEqual(niceWords[3].id); // you.
    });

    it("9. duplicate hello sentence", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "Hello. Nice to meet you.");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const [sHello, sNice] = para.childrenIds.map((id) =>
        model.getElement(id)
      );

      model.updateElement(para.id, "Hello. Hello. Nice to meet you.");

      const newPara = model.getElement(model.getRootElement().childrenIds[0]);
      const [first, second, third] = newPara.childrenIds.map((id) =>
        model.getElement(id)
      );
      expect(first.id).toEqual(sHello.id);
      expect(second.id).not.toEqual(sHello.id);
      expect(third.id).toEqual(sNice.id);
    });

    it("10. partial reuse then new sentence", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "Hello. Nice to meet you.");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const sNice = model.getElement(para.childrenIds[1]);

      model.updateElement(
        para.id,
        "Hello. Very nice to meet you. Nice to meet you."
      );

      const newPara = model.getElement(model.getRootElement().childrenIds[0]);
      const [first, second, third] = newPara.childrenIds.map((id) =>
        model.getElement(id)
      );
      expect(first.contents).toBe("");
      expect(first.id).toEqual(
        para.childrenIds.map((id) => model.getElement(id))[0].id
      );
      expect(second.id).not.toEqual(sNice.id);
      expect(third.id).not.toEqual(sNice.id);
    });

    it("11. 'A B.' -> 'X A B.'", () => {
      const root = model.getRootElement();
      model.updateElement(root.id, "A B.");
      const para = model.getElement(model.getRootElement().childrenIds[0]);
      const sent = model.getElement(para.childrenIds[0]);
      const [wA, wB] = sent.childrenIds.map((cid) => model.getElement(cid));

      model.updateElement(sent.id, "X A B.");

      const newSent = model.getElement(
        model.getElement(model.getRootElement().childrenIds[0]).childrenIds[0]
      );
      const words = newSent.childrenIds.map((cid) => model.getElement(cid));
      expect(words[1].id).toEqual(wA.id);
      expect(words[2].id).toEqual(wB.id);
    });
  });
});
