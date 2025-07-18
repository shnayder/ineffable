// Hierarchical structure of a document. For now, ignoring complex whitespace and including punctuation in words.

import { Id } from "@/utils/nanoid";

// Kinds of elements
// For now, static, but could be user defined
export type ElementKind = "document" | "paragraph" | "sentence" | "word";

export function getChildKind(kind: ElementKind): ElementKind {
  const childKind: Record<ElementKind, ElementKind> = {
    document: "paragraph",
    paragraph: "sentence",
    sentence: "word",
    word: "word",
  };
  return childKind[kind];
}

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

export interface DocumentVersion {
  id: Id;
  rootId: Id; // Id of the root Element, which should have kind "document"
  docVersionNumber: number;
  formatVersion: "1.0"; // Version of the document format
}

export type AnnotationKind = "critique" | "suggestion" | "question" | "comment";

export type AnnotationStatus = "open" | "resolved" | "outdated";

export interface Annotation {
  id: Id;
  // target of the annotation is saved in the ElementAnnotations table
  // (this way we don't have to make a new annotation object when there's a new version of the element)
  previousVersionId: Id; // if this is an edit of an existing annotation, point at the parent
  kind: AnnotationKind;
  contents: string;
  status: AnnotationStatus;
  createdAt: Date;
}

// Mapping table between elements and annotations.
// Validity managed based on documentVersion.
// Mostly append-only. Exception: validThroughVersion starts null,
// gets set when lifetime ends.
export interface ElementAnnotation {
  elementId: Id;
  annotationId: Id;
  validFromVersion: number;
  // validThroughVersion starts null, gets set when validity limit is clear
  // (when a new version of the annotation is created, or it's deleted)
  validThroughVersion: number | null; // inclusive
}
