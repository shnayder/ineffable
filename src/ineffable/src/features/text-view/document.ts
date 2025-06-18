import { Annotation, Document, Paragraph, Sentence, Word } from "./types";

// TODO: I want more permanent ids that don't change if I add a word to a sentence. But not hashes, since the same word or sentence in different paragraphs should have different ids. ID service? or GUIDs?
// For now, using simple incremental ids based on paragraph and sentence indices.
export function parseRawText(raw: string[]): Document {
  const paragraphs: Paragraph[] = raw.map((para, pIdx) => {
    const sentences = (para.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || []).map(
      (sentence, sIdx) => {
        const words = sentence
          .trim()
          .split(/\s+/)
          .map((word, wIdx) => ({
            id: `p${pIdx}-s${sIdx}-w${wIdx}`,
            text: word,
          }));
        return {
          id: `p${pIdx}-s${sIdx}`,
          text: sentence,
          words,
        };
      }
    );
    return {
      id: `p${pIdx}`,
      text: para,
      sentences,
    };
  });
  // Build elementMap while parsing
  const elementMap: Record<string, Paragraph | Sentence | Word> = {};

  paragraphs.forEach((para) => {
    elementMap[para.id] = para;
    para.sentences.forEach((sentence) => {
      elementMap[sentence.id] = sentence;
      sentence.words.forEach((word) => {
        elementMap[word.id] = word;
      });
    });
  });

  return { paragraphs, elementMap };
}

export function addMockAnnotations(document: Document): Document {
  // Add mock annotations to the first paragraph, sentence, and word
  const firstParagraph = document.paragraphs[0];
  if (firstParagraph) {
    const firstSentence = firstParagraph.sentences[0];
    if (firstSentence) {
      const firstWord = firstSentence.words[0];
      if (firstWord) {
        document.annotations = {
          [firstParagraph.id]: [
            {
              id: "1",
              kind: "comment",
              text: "This is a mock comment on the first paragraph.",
              targetId: firstParagraph.id,
              createdAt: new Date(),
            },
            {
              id: "4",
              kind: "suggestion",
              text: "This is a mock suggestion on the first paragraph.",
              targetId: firstParagraph.id,
              createdAt: new Date(),
            },
            {
              id: "5",
              kind: "suggestion",
              text: "This is another suggestion on the first paragraph.",
              targetId: firstParagraph.id,
              createdAt: new Date(),
            },
          ],
          [firstSentence.id]: [
            {
              id: "2",
              kind: "suggestion",
              text: "This is a mock annotation for the first sentence.",
              targetId: firstSentence.id,
              createdAt: new Date(),
            },
            {
              id: "6",
              kind: "question",
              text: "This is a mock question for the first sentence.",
              targetId: firstSentence.id,
              createdAt: new Date(),
            },
          ],
          [firstWord.id]: [
            {
              id: "3",
              kind: "critique",
              text: "This is a mock critique for the first word.",
              targetId: firstWord.id,
              createdAt: new Date(),
            },
          ],
        };
      }
    }
  }
  return document;
}

export function getAnnotationsForId(doc: Document, id: string): Annotation[] {
  return doc.annotations?.[id] ?? [];
}
