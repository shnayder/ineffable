// Hierarchical structure of a document. For now, ignoring complex whitespace and including punctuation in words.

export type Word = {
  id: string; // e.g. "p0-s1-w2"
  text: string; // the word itself
};

export type Sentence = {
  id: string; // e.g. "p0-s1"
  text: string; // full sentence
  words: Word[]; // its words
};

export type Paragraph = {
  id: string; // e.g. "p0"
  text: string; // full paragraph
  sentences: Sentence[];
};

export type Document = {
  paragraphs: Paragraph[];
  elementMap: { [id: string]: Paragraph | Sentence | Word };
};
