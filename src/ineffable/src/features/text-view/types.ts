// Hierarchical structure of a document. For now, ignoring complex whitespace and including punctuation in words.

import { Id } from "@/utils/nanoid";

// Kinds of elements
// For now, static, but could be user defined
export type ElementKind = "document" | "paragraph" | "sentence" | "word";

// Document Elements
// Note: not insisting via type system that these are hierarchical, but they are
export interface Element {
  id: Id;
  kind: ElementKind;
  contents?: string; // for leaf nodes, this is the text content
  childrenIds: Id[];
  createdAt: Date; // timestamp of when the element was created
  // No updated timestamps -> Elements are immutable
}

export type AnnotationKind = "critique" | "suggestion" | "question" | "comment";

export type AnnotationStatus = "open" | "resolved" | "outdated";

export interface Annotation {
  id: Id;
  targetId: Id; // Id of the target element (paragraph, sentence, or word)
  kind: AnnotationKind;
  contents: string;
  createdAt: Date;
  status: AnnotationStatus;
}

export interface DocumentVersion {
  id: Id;
  allElements: Element[];
  annotations: Annotation[];
  rootId: Id; // Id of the root Element, which should have kind "document"
  version: number;
  formatVersion: "1.0"; // Version of the document format
}
