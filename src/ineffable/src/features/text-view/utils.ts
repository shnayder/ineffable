import { Document, Paragraph, Sentence, Word } from "./types";

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
