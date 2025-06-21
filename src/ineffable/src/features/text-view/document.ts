import { Annotation, DocumentVersion, Element } from "./types";
import { myNanoid, Id } from "@/utils/nanoid";

/**
 * A model for the document. Provides methods to access and manipulate the document structure.
 * DocumentVersions are immutable, so will handle updates by creating new versions.
 * Internally manages structures for quick access to elements.
 */
export class DocumentModel {
  private _version: DocumentVersion;
  private _elementById: Record<Id, Element> = {};
  private _elementParent: Record<Id, Id> = {}; // childId -> parentId. No entry for root element.
  private _elementAnnotations: Record<Id, Annotation[]> = {};
  private _annotationById: Record<Id, Annotation> = {};

  constructor(version: DocumentVersion) {
    this._version = version;
    this._buildStructures();
  }

  private _buildStructures() {
    // Build elementMap and parentMap from the root element
    this._buildElementById();
    this._buildAnnotationById();
    this._buildElementParent();
    this._buildElementAnnotations();
  }

  private _buildElementById() {
    this._elementById = {};
    for (const element of this._version.allElements) {
      this._elementById[element.id] = element;
    }
  }

  private _buildAnnotationById() {
    this._annotationById = {};
    for (const annotation of this._version.annotations) {
      this._annotationById[annotation.id] = annotation;
    }
  }

  /**
   * Builds a mapping of each node's ID to its parent's ID within the document tree.
   *
   * Invariant: this.elementById must be populated before calling this method.
   * @private
   */
  private _buildElementParent() {
    // Build parentMap from the root element
    let map: Record<Id, Id> = {};

    const traverse = (nodeId: Id, parentId?: Id) => {
      if (parentId) {
        map[nodeId] = parentId;
      }
      const node = this._elementById[nodeId];
      if (node.childrenIds) {
        for (const childId of node.childrenIds) {
          traverse(childId, node.id);
        }
      }
    };
    traverse(this._version.rootId);
    this._elementParent = map;
  }

  /**
   * Builds a mapping of element IDs to their annotations.
   */
  private _buildElementAnnotations() {
    this._elementAnnotations = {};
    for (const annotation of this._version.annotations) {
      if (!this._elementAnnotations[annotation.targetId]) {
        this._elementAnnotations[annotation.targetId] = [];
      }
      this._elementAnnotations[annotation.targetId].push(annotation);
    }
  }

  /** Public methods below **/
  get root(): Element {
    return this._elementById[this._version.rootId];
  }

  getElementById(id: Id): Element | undefined {
    return this._elementById[id];
  }

  /**
   *
   * @param id - The ID of the element whose children you want to retrieve.
   * @returns the list of child elements. If the element doesn't exist or has no children, returns an empty array.
   */
  getChildElements(id: Id): Element[] {
    const element = this._elementById[id];
    if (!element || !element.childrenIds) {
      return [];
    }
    return element.childrenIds
      .map((childId) => this._elementById[childId])
      .filter(Boolean);
  }

  getAnnotationById(id: Id): Annotation | undefined {
    return this._annotationById[id];
  }

  getAnnotationsForElementId(id: Id): Annotation[] {
    return this._elementAnnotations[id] || [];
  }

  /* TODO: add editing methods */
}

/**
 * @param raw - An string, with newlines between paragraphs.
 * Each paragraph will be split into sentences, and each sentence into words.
 * @returns a DocumentVersion object representing the structured document.
 */
export function createDocumentVersionFromText(raw: string): DocumentVersion {
  let version: DocumentVersion = {
    id: myNanoid(),
    allElements: [],
    annotations: [],
    rootId: myNanoid() as Id,
    version: 1,
    formatVersion: "1.0",
  };

  // Create the root document element and add it to the version
  const rootElement: Element = {
    id: version.rootId,
    kind: "document",
    childrenIds: [],
    createdAt: new Date(),
  };
  version.allElements.push(rootElement);

  // Split the raw text into paragraphs
  const paragraphs = raw.split(/\n+/).filter((para) => para.trim() !== "");

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const paraText = paragraphs[pIdx];
    const paraId = myNanoid() as Id;
    const paraElement: Element = {
      id: paraId,
      kind: "paragraph",
      childrenIds: [],
      createdAt: new Date(),
    };

    // Split paragraph into sentences
    const sentenceMatches =
      paraText.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [];
    for (let sIdx = 0; sIdx < sentenceMatches.length; sIdx++) {
      const sentenceText = sentenceMatches[sIdx].trim();
      const sentenceId = myNanoid() as Id;
      const sentenceElement: Element = {
        id: sentenceId,
        kind: "sentence",
        childrenIds: [],
        createdAt: new Date(),
      };

      // Split sentence into words
      const wordTexts = sentenceText.split(/\s+/).filter(Boolean);
      for (let wIdx = 0; wIdx < wordTexts.length; wIdx++) {
        const wordText = wordTexts[wIdx];
        const wordId = myNanoid() as Id;
        const wordElement: Element = {
          id: wordId,
          kind: "word",
          childrenIds: [],
          contents: wordText,
          createdAt: new Date(),
        };
        version.allElements.push(wordElement);
        sentenceElement.childrenIds!.push(wordId);
      }

      version.allElements.push(sentenceElement);
      paraElement.childrenIds!.push(sentenceId);
    }

    version.allElements.push(paraElement);
    rootElement.childrenIds!.push(paraId);
  }
  return version;
}

/**
 * @param raw - An string, with newlines between paragraphs.
 * Each paragraph will be split into sentences, and each sentence into words.
 * @returns a DocumentVersion object representing the structured document.
 */
export function createDocumentModelFromText(raw: string): DocumentModel {
  const version = createDocumentVersionFromText(raw);
  return new DocumentModel(version);
}

// export function addMockAnnotations(document: Document): Document {
//   // Add mock annotations to the first paragraph, sentence, and word
//   const firstParagraph = document.paragraphs[0];
//   if (firstParagraph) {
//     const firstSentence = firstParagraph.sentences[0];
//     if (firstSentence) {
//       const firstWord = firstSentence.words[0];
//       if (firstWord) {
//         document.annotations = {
//           [firstParagraph.id]: [
//             {
//               id: "1",
//               kind: "comment",
//               text: "This is a mock comment on the first paragraph.",
//               targetId: firstParagraph.id,
//               createdAt: new Date(),
//             },
//             {
//               id: "4",
//               kind: "suggestion",
//               text: "This is a mock suggestion on the first paragraph.",
//               targetId: firstParagraph.id,
//               createdAt: new Date(),
//             },
//             {
//               id: "5",
//               kind: "suggestion",
//               text: "This is another suggestion on the first paragraph.",
//               targetId: firstParagraph.id,
//               createdAt: new Date(),
//             },
//           ],
//           [firstSentence.id]: [
//             {
//               id: "2",
//               kind: "suggestion",
//               text: "This is a mock annotation for the first sentence.",
//               targetId: firstSentence.id,
//               createdAt: new Date(),
//             },
//             {
//               id: "6",
//               kind: "question",
//               text: "This is a mock question for the first sentence.",
//               targetId: firstSentence.id,
//               createdAt: new Date(),
//             },
//           ],
//           [firstWord.id]: [
//             {
//               id: "3",
//               kind: "critique",
//               text: "This is a mock critique for the first word.",
//               targetId: firstWord.id,
//               createdAt: new Date(),
//             },
//           ],
//         };
//       }
//     }
//   }
//   return document;
// }

// export function getAnnotationsForId(doc: Document, id: string): Annotation[] {
//   return doc.annotations?.[id] ?? [];
// }
