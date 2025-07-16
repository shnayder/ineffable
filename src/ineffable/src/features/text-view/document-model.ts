import { Id, myNanoid } from "@/utils/nanoid";
import { useDocStore } from "./document-store";
import { Annotation, Element, DocumentVersion, ElementKind } from "./types";
import { getOrThrow } from "@/utils/maphelp";

// --- DocumentModel: business logic, caching, parent relationships, immutable updates ---
export class DocumentModel {
  // keep it public so we can access it in tests, but otherwise treat it as private.
  _store = useDocStore.getState();
  private parentMap = new Map<Id, Id>();
  // TODO: handle annotations

  constructor() {
    // initial build
    this.rebuildCaches();
    // Ensure we have a current version and root element
    if (this._store.currentVersionNumber == null) {
      console.log("Creating initial root element");
      const rootId = myNanoid();
      const rootElement: Element = {
        id: rootId,
        kind: "document",
        contents: "",
        childrenIds: [],
        createdAt: new Date(),
      };
      this._store.addElement(rootElement);
      this._store.addVersion(rootId);
    }
  }

  private rebuildCaches() {
    // build parentMap via traversal from current root
    this.parentMap.clear();
    const curVer = this._store.currentVersionNumber;
    if (curVer == null) return;
    const rootId = this._store.versions[curVer].rootId;
    const root = this._store.getElement(rootId);
    if (!root) {
      return;
    }
    root.childrenIds.forEach((childId) => {
      this.walkAndMapParents(childId, rootId);
    });
  }

  private walkAndMapParents(id: Id, parent: Id) {
    this.parentMap.set(id, parent);
    const el = this._store.getElement(id);
    if (!el) return;
    el.childrenIds.forEach((childId) => this.walkAndMapParents(childId, id));
  }

  /* Read */

  /**
   *
   * Get the root element of the current version. The model ensures that there is always a current version with a root
   * element of kind "document".
   *
   * @returns the root element of the current document version.
   */
  getRootElement(): Element {
    const curVer = this._store.currentVersionNumber;
    if (curVer == null) {
      throw new Error("No current version set");
    }
    const rootId = this._store.versions[curVer].rootId;
    const rootElement = this._store.getElement(rootId);
    if (!rootElement) {
      throw new Error(`Root element with id ${rootId} not found`);
    }
    return rootElement;
  }

  /**
   * Gets the element or throws — elements should never be deleted, so don't expect to get null.
   * (but beware partial failure since we don't have transactions yet ;)
   *
   * @param id
   * @returns
   */
  getElement(id: Id): Element {
    const el = this._store.getElement(id);
    if (!el) {
      throw new Error(`Element with id ${id} not found`);
    }
    return el;
  }

  getAnnotationsFor(elementId: Id): Annotation[] {
    return []; // this.annotationMap.get(elementId) ?? [];
  }

  /* Write */

  /**
   * Updates an existing element with new contents. Since we have an immutable model, this actually creates a new
   * element and bubbles the change up to the root. Also handles parsing text into hierarhical elements.
   *
   *  - for word Elements, create new element with new contents and bubble up.
   *  - for sentence and above, parse contents, create new child elements or reuse old as necessary, then bubble up.
   *
   * @param origElementId Id of the element to update
   * @param newContents New contents for the element. For higher level elements, it will be parsed into sub-elements. It
   * should not be empty — use deleteElement to remove.
   * @returns nothing
   */
  updateElement(origElementId: Id, newContents: string): void {
    const oldElement = this.getElement(origElementId);
    if (!oldElement) {
      throw new Error(`Element with id ${origElementId} not found`);
    }
    // Create new element or elements, adding them to the store and updating the parentMap where needed.
    let newElementIds: Id[] = this._parseContentsToElements(
      newContents,
      oldElement.kind,
      oldElement.childrenIds
    );

    if (newElementIds.length === 0) {
      throw new Error(
        `No new elements created from contents for element with id ${origElementId}`
      );
    }
    this._replaceElement(oldElement, newElementIds);
  }

  /**
   * Replaces an existing element with one or more new elements, bubbling the change up to the root and creating a new
   * version.
   *
   * @param origElement The original element to replace
   * @param newElementIds An array of Ids of the new elements to replace the old one. If the old element was a document,
   *                      there must be exactly one new element. For other kinds, there can be multiple new elements.
   *                      All elements in this array must already exist in the store. Any that have children must be
   *                      updated in parentMap as parents. (The new elements do not need to have parents yet — they
   *                      might be new).
   * @returns nothing
   */
  _replaceElement(origElement: Element, newElementIds: Id[]): void {
    let origElementId = origElement.id;
    if (origElement.kind === "document" && newElementIds.length > 1) {
      throw new Error(
        `Cannot update document element with more than one new elements: got ${newElementIds.length}`
      );
    }

    // If the old element was a document, we need to create a new root element
    if (origElement.kind === "document") {
      // Add a new version to the store, point at the new element.
      // (There must be exactly 1 — we checked above.)
      this._store.addVersion(newElementIds[0]);
    } else {
      // bubble up the changes to the document level
      // TODO: handle annotations
      let origParentId = this.parentMap.get(origElementId);
      if (!origParentId) {
        throw new Error(`Element with id ${origElementId} has no parent`);
      }
      let newParent = this._replaceParent(origElementId, newElementIds);

      while (newParent.kind !== "document") {
        // Go up one level — now we need to update oldParent's parent to point at new parent
        origParentId = this.parentMap.get(origParentId);
        if (!origParentId) {
          throw new Error(
            `Element with id ${origParentId} has no parent, cannot bubble up`
          );
        }
        newParent = this._replaceParent(origParentId, [newParent.id]);
      }

      // At this point, newParent should be the new root document element
      // Add a new version with it as the root id.
      this._store.addVersion(newParent.id);
    }
  }

  /**
   * Parses a string of text for an element into a list of new Element objects.
   *
   * - Insert new elements into the store.
   * - (TODO:) For non-leaf elements, reuse existing children if they match the parsed contents closely enough
   *    (Starting with exact match.)
   * - Update the parentMap for new elements within the returned subtrees.
   * - Does _not_ insert the returned elements into the document tree — the caller must do that and update the parentMap based on those changes.
   *
   * @returns An array of Ids of the new elements created from the contents.
   */
  _parseContentsToElements(
    contents: string,
    kind: Element["kind"],
    originalChildrenIds: Id[]
  ): Id[] {
    // Implementation notes:
    // - for a word, simple enough: create a new Element with the new contents, add it to the store.
    // - for a sentence: Split contents into words, and loop through to make a list of children. If there's a matching word among the original children, use that id. If not, make a new word Element. Then create a new sentence Element with the new list of children.
    // - for a paragraph or document. Can do same logic if only looking one level down. So if editing a paragraph, only sentences that didn't change at all would be reused.

    // - TODO for impact of this on annotations —- if I add a comma to a sentence, would be nice to keep annotations on that sentence. Same for words. Would handle that by doing recursive updates, so we'd create a new version of the existing element rather than a completely new one. (Presuming that we have a way to keep annotations as we make new versions of elements)

    // TODO: For now, ignoring originalChildrenIds, not doing any matching — works great for initial load, not for edits.

    let addElement = (
      text: string,
      kind: ElementKind,
      childrenIds: Id[] | undefined = undefined
    ): Id => {
      if (text.trim() === "") {
        throw new Error("Cannot create a word element with empty contents");
      }
      const element = {
        id: myNanoid(),
        kind,
        contents: text,
        childrenIds: childrenIds ?? [],
        createdAt: new Date(),
      };
      this._store.addElement(element);
      return element.id;
    };

    let addSentence = (sentenceContents: string): Id => {
      const wordTexts = sentenceContents.split(/\s+/).filter(Boolean);
      let childrenIds = wordTexts.map((word) => addElement(word, "word"));
      let sentenceElement = addElement(
        sentenceContents,
        "sentence",
        childrenIds
      );
      // add parentMap entries for the new children
      childrenIds.forEach((cid) => {
        this.parentMap.set(cid, sentenceElement);
      });
      // return the new sentence element id
      return sentenceElement;
    };

    let addParagraph = (paragraphContents: string): Id => {
      const sentenceTexts = paragraphContents
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean);
      let childrenIds = sentenceTexts.map((sentence) => addSentence(sentence));
      let paragraphElement = addElement(
        paragraphContents,
        "paragraph",
        childrenIds
      );
      // add parentMap entries for the new children
      childrenIds.forEach((cid) => {
        this.parentMap.set(cid, paragraphElement);
      });
      // return the new paragraph element id
      return paragraphElement;
    };

    let addDocument = (documentContents: string): Id => {
      const paragraphTexts = documentContents
        .split(/\n\s*\n/)
        .filter((para) => para.trim() !== "")
        .filter(Boolean);
      let childrenIds = paragraphTexts.map((paragraph) =>
        addParagraph(paragraph)
      );
      let documentElement = addElement(
        documentContents,
        "document",
        childrenIds
      );
      // add parentMap entries for the new children
      childrenIds.forEach((cid) => {
        this.parentMap.set(cid, documentElement);
      });
      // return the new document element id
      return documentElement;
    };

    // For now, only handle words
    if (kind === "word") {
      return [addElement(contents, "word")];
    } else if (kind === "sentence") {
      return [addSentence(contents)];
    } else if (kind === "paragraph") {
      return [addParagraph(contents)];
    } else if (kind === "document") {
      return [addDocument(contents)];
    } else {
      throw new Error(`Unknown element kind: ${kind}`);
    }
  }

  // We've created one or more new elements to replace an existing one, and need to update the parent. This function handles one level of that.
  //
  // Take the id of the original child and a list of new child ids. Both must already exist in the store.
  // TODO: check about annotation-related invariants when I add those.
  // What it does:
  // - Find the parent of the original child.
  // - Make a new parent element with the updated children, add it to the store.
  // - Update the parentMap to point the new child ids to the new parent.

  // Returns the new parent Element.
  //
  // **Note: not recursive!** Caller will need to call again to update the parent's parent, until you reach the root element.
  // TODO: what about annotations?
  _replaceParent(oldChildId: Id, newChildIds: Id[]): Element {
    const oldParentId: Id = getOrThrow(this.parentMap, oldChildId);
    if (!oldParentId) {
      throw new Error(`Element with id ${oldChildId} has no parent`);
    }
    const oldParent = this.getElement(oldParentId);
    if (!oldParent) {
      throw new Error(`Parent element with id ${oldParentId} not found`);
    }
    // Create a new parent element with the updated child ids in place of the old child id in the parent's childrenIds.

    let newChildrenIds = oldParent.childrenIds.flatMap((cid) =>
      cid === oldChildId ? newChildIds : [cid]
    );
    let newParent = {
      ...oldParent,
      id: myNanoid(),
      childrenIds: newChildrenIds,
      createdAt: new Date(),
    };
    // Add the new parent to the store
    this._store.addElement(newParent);
    // Update the parentMap for the new children
    newChildIds.forEach((cid) => {
      this.parentMap.set(cid, newParent.id);
    });
    // Return the new parent element
    return newParent;
  }

  // TODO: createElement
  // do I want createSibling(sibId, before/after), or createChild(parent, index), or something else.
  // See what I need in the app.

  /**
   * Delete the element with the given id. Internally, creates a new version where this element is removed from the parent's childrenIds. The element will not be removed from the store, so it can still be accessed in previous versions.
   *
   * @param id Id of the element to delete. This should never be a document element, since we don't delete those.
   * @throws Error if the element is a document or if the element does not exist.
   * @returns nothing
   */
  deleteElement(id: Id): void {
    const el = this.getElement(id);
    if (!el) {
      throw new Error(`Element with id ${id} not found`);
    }

    // Replace with empty list to remove it from the parent's childrenIds.
    // This will bubble up to the root element, creating a new version.
    this._replaceElement(el, []);
  }

  // // write paths incrementally update caches + store
  // addAnnotation(targetId: Id, kind: Annotation["kind"], contents: string): Id {
  //   const id = myNanoid();
  //   this.store.addAnnotation({ id, targetId, kind, contents, status: "open" });
  //   const ann: Annotation = {
  //     id,
  //     targetId,
  //     kind,
  //     contents,
  //     status: "open",
  //     createdAt: new Date(),
  //   };
  //   const arr = this.annotationMap.get(targetId) ?? [];
  //   this.annotationMap.set(targetId, [...arr, ann]);
  //   return id;
  // }

  // resolveAnnotation(id: Id): void {
  //   const ann = this.store.getAnnotation(id);
  //   if (!ann) return;
  //   // update store
  //   this.store.addAnnotation({ ...ann, status: "resolved" });
  //   // update cache
  //   const arr = this.annotationMap.get(ann.targetId) ?? [];
  //   this.annotationMap.set(
  //     ann.targetId,
  //     arr.map((a) => (a.id === id ? { ...a, status: "resolved" } : a))
  //   );
  // }
}

export const docModel = new DocumentModel();

// A wrapper hook for components to access element and be re-rendered when it changes.
export function useElement(id: Id): Element {
  return useDocStore((s) => s.elements[id]);
}

export function useCurrentVersion(): DocumentVersion {
  return useDocStore((s) => {
    const version = s.versions[s.currentVersionNumber ?? -1];
    if (!version) {
      throw new Error("No current version found");
    }
    return version;
  });
}

export function useMaxVersionNumber(): number {
  return useDocStore((s) => s.nextVersionNumber - 1);
}

// Same idea for annotations. TODO.
// export function useAnnotations(id: Id) {
//   const [list, setList] = useState(() => docModel.getAnnotationsFor(id));
//   useEffect(() => {
//     // subscribe only to raw-annotations map
//     return useDocStore.subscribe(
//       s => s.annotations[id],
//       () => {
//         setList(docModel.getAnnotationsFor(id));
//       }
//     );
//   }, [id]);
//   return list;
// }

// TODO: update to new model interface once I add annotation support back in
// function addMockAnnotations(document: DocumentVersion): void {
//   // Add mock annotations to the first paragraph, sentence, and word
//   if (!document.allElements || document.allElements.length === 0) {
//     return;
//   }
//   // Find root element
//   let root = document.allElements.find((el) => el.id === document.rootId);
//   if (!root || root.childrenIds.length === 0) {
//     return; // No root element or no children
//   }

//   const firstParagraph = document.allElements.find(
//     (el) => el.id === root.childrenIds[0]
//   );
//   if (!firstParagraph || firstParagraph.kind !== "paragraph") {
//     return; // No first paragraph found
//   }

//   document.annotations.push(
//     {
//       id: myNanoid(),
//       targetId: firstParagraph.id,
//       kind: "comment",
//       contents: "This is a mock comment on the first paragraph.",
//       createdAt: new Date(),
//       status: "open",
//     },
//     {
//       id: myNanoid(),
//       targetId: firstParagraph.id,
//       kind: "suggestion",
//       contents: "This is a mock suggestion on the first paragraph.",
//       createdAt: new Date(),
//       status: "open",
//     },
//     {
//       id: myNanoid(),
//       targetId: firstParagraph.id,
//       kind: "suggestion",
//       contents: "This is another suggestion on the first paragraph.",
//       createdAt: new Date(),
//       status: "open",
//     }
//   );
// }
