import { Id, myNanoid } from "@/utils/nanoid";
import { useDocStore, type DocState } from "./document-store";
import type { UseBoundStore } from "zustand";
import { Annotation, Element, DocumentVersion, ElementKind } from "./types";
import { getOrThrow } from "@/utils/maphelp";
import { greedyMatchParts } from "./reuse-utils";

// --- DocumentModel: business logic, caching, parent relationships, immutable updates ---
export class DocumentModel {
  // keep it public so we can access it in tests, but otherwise treat it as private.
  _store: typeof useDocStore;
  private parentMap = new Map<Id, Id>();
  // TODO: handle annotations

  constructor(
    store: typeof useDocStore = useDocStore,
    sampleText: string = ""
  ) {
    this._store = store;
    // initial build
    this.rebuildCaches();
    // Ensure we have a current version and root element
    const state = this._store.getState();
    if (state.currentVersionNumber == null) {
      console.log("Creating initial root element");
      const rootId = myNanoid();
      const rootElement: Element = {
        id: rootId,
        kind: "document",
        contents: "",
        childrenIds: [],
        createdAt: new Date(),
      };
      state.addElement(rootElement);
      state.addVersion(rootId);
    }

    // If there's nothing in the store, use the sample text
    const root = this.getRootElement();
    if (root.childrenIds.length === 0 && sampleText) {
      this.updateElement(root.id, sampleText);
    }
  }

  private rebuildCaches() {
    // build parentMap via traversal from current root
    this.parentMap.clear();
    const state = this._store.getState();
    const curVer = state.currentVersionNumber;
    if (curVer == null) return;
    const rootId = state.versions[curVer].rootId;
    const root = state.getElement(rootId);
    if (!root) {
      return;
    }
    root.childrenIds.forEach((childId) => {
      this.walkAndMapParents(childId, rootId);
    });
  }

  private walkAndMapParents(id: Id, parent: Id) {
    this.parentMap.set(id, parent);
    const { getElement } = this._store.getState();
    const el = getElement(id);
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
    const state = this._store.getState();
    const curVer = state.currentVersionNumber;
    if (curVer == null) {
      throw new Error("No current version set");
    }
    const rootId = state.versions[curVer].rootId;
    const rootElement = state.getElement(rootId);
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
    const { getElement } = this._store.getState();
    const el = getElement(id);
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
      oldElement.id
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
    const state = this._store.getState();
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
      state.addVersion(newElementIds[0]);
    } else {
      // bubble up the changes to the document level
      // TODO: handle annotations
      let origParentId = this.parentMap.get(origElementId);
      if (!origParentId) {
        throw new Error(`Element with id ${origElementId} has no parent`);
      }
      let newParent = this._replaceParent(origElementId, newElementIds);
      // console.log(
      //   `Created new parent ${newParent.id} (${newParent.kind}) for old parent ${origParentId}`
      // );

      while (newParent.kind !== "document") {
        // replace the original parent with the new parent
        //        console.log(`replacing ${origParentId} with ${newParent.id}`);
        newParent = this._replaceParent(origParentId, [newParent.id]);
        //        console.log(`Created new parent ${newParent.id} (${newParent.kind})`);

        if (newParent.kind !== "document") {
          // Go up one level — now we need to update oldParent's parent to point at new parent
          origParentId = this.parentMap.get(origParentId);
          if (!origParentId) {
            throw new Error(
              `Element with id ${origParentId} has no parent, cannot bubble up`
            );
          }
        } // else we're done
      }

      // At this point, newParent should be the new root document element
      // Add a new version with it as the root id.
      state.addVersion(newParent.id);
    }
  }

  /**
   * Helper to split a contents string into multiple elements of the specified kind.
   *   - for a word, split by whitespace.
   *   - for a sentence, split by punctuation and whitespace.
   *   - for a paragraph, split by double newlines.
   */
  _splitContents = (text: string, kind: ElementKind): string[] => {
    switch (kind) {
      case "word":
        return text.split(/\s+/).filter(Boolean);
      case "sentence":
        return text.split(/(?<=[.!?])\s+/).filter(Boolean);
      case "paragraph":
        return text
          .split(/\n\s*\n/)
          .filter((para) => para.trim() !== "")
          .filter(Boolean);
      case "document":
        return [text]; // Documents are not split further at this level
      default:
        throw new Error(`Unknown element kind: ${kind}`);
    }
  };

  /**
   * Parses a string of text for an element into a list of new Element objects.
   *
   * - Insert new elements into the store.
   * - (TODO:) For non-leaf elements, reuse existing children if they match the parsed contents closely enough
   *    (Starting with exact match.)
   * - Update the parentMap for new elements within the returned subtrees.
   * - Does _not_ insert the returned elements into the document tree — the caller must do that and update the parentMap based on those changes.
   * - Note: contents may contain more than one element of the specified kind. So e.g. we may get "A B" and
   *   kind="word", and should return two new word elements.
   *
   * @param previousId If provided, this is the element that we're replacing. It or its children can be reused if they match.
   *
   * @returns An array of Ids of the new elements created from the contents.
   */
  _parseContentsToElements(
    contents: string,
    kind: Element["kind"],
    previousId?: Id
  ): Id[] {
    const contentParts = this._splitContents(contents, kind);

    // Get the original children ids from the parent if provided
    let prevChildrenIds: Id[] = [];
    let prevFullContents: string | undefined;
    if (previousId) {
      const el = this.getElement(previousId);
      prevChildrenIds = el.childrenIds;
      prevFullContents = this.computeFullContents(previousId);
    }

    // Handle multiple new elements at this level
    if (contentParts.length > 1) {
      let usedPrev = false;
      return contentParts
        .map((part) => {
          if (
            previousId &&
            !usedPrev &&
            prevFullContents &&
            part === prevFullContents
          ) {
            usedPrev = true;
            return [previousId];
          }
          return this._parseContentsToElements(part, kind);
        })
        .flat();
    }

    // Single part - proceed with original logic

    const { addElement } = this._store.getState();

    let addElementFn = (
      text: string,
      kind: ElementKind,
      childrenIds: Id[] | undefined = undefined
    ): Id => {
      if (kind === "word" && text.trim() === "") {
        throw new Error("Cannot create a word element with empty contents");
      }
      const element = {
        id: myNanoid(),
        kind,
        contents: kind === "word" ? text : "",
        childrenIds: childrenIds ?? [],
        createdAt: new Date(),
      };
      addElement(element);
      return element.id;
    };

    const addSentence = (sentenceContents: string, prevId?: Id): Id => {
      let wordTexts = this._splitContents(sentenceContents, "word");
      let childIds: Id[] = [];
      if (prevId) {
        const prevEl = this.getElement(prevId);
        const prevWords = prevEl.childrenIds.map((cid) =>
          this.computeFullContents(cid)
        );
        
        // Determine which of the new words correspond to children of the
        // previous sentence. Each match has the index of the old child and
        // whether it was an exact text match.
        const matches = greedyMatchParts(
          prevEl.childrenIds.map((id, i) => ({ id, text: prevWords[i] })),
          wordTexts,
          (t: string) => [t],
          0.25
        );
        for (let i = 0; i < matches.length; i++) {
          const m = matches[i];
          const part = wordTexts[i];
          if (m.oldIndex != null && m.exact) {
            childIds.push(prevEl.childrenIds[m.oldIndex]);
          } else if (m.oldIndex != null) {
            // The new word partially matches an old child. Re-parse that
            // portion using the old word so any grandchildren can be reused.
            childIds.push(
              this._parseContentsToElements(
                part,
                "word",
                prevEl.childrenIds[m.oldIndex]
              )[0]
            );
          } else {
            childIds.push(addElementFn(part, "word"));
          }
        }
      } else {
        childIds = wordTexts.map((word) => addElementFn(word, "word"));
      }
      let sentenceElement = addElementFn(
        sentenceContents,
        "sentence",
        childIds
      );
      childIds.forEach((cid) => this.parentMap.set(cid, sentenceElement));
      return sentenceElement;
    };

    const addParagraph = (paragraphContents: string, prevId?: Id): Id => {
      const sentenceTexts = this._splitContents(paragraphContents, "sentence");
      let childIds: Id[] = [];
      if (prevId) {
        const prevEl = this.getElement(prevId);
        const prevSents = prevEl.childrenIds.map((cid) =>
          this.computeFullContents(cid)
        );
        
        // Match new sentences against the previous paragraph's children.
        const matches = greedyMatchParts(
          prevEl.childrenIds.map((id, i) => ({ id, text: prevSents[i] })),
          sentenceTexts,
          (t: string) => this._splitContents(t, "word"),
          0.25
        );
        for (let i = 0; i < matches.length; i++) {
          const m = matches[i];
          const part = sentenceTexts[i];
          if (m.oldIndex != null && m.exact) {
            childIds.push(prevEl.childrenIds[m.oldIndex]);
          } else if (m.oldIndex != null) {
            // Partial match — recursively parse with the old sentence to
            // reuse any matching words.
            childIds.push(
              this._parseContentsToElements(
                part,
                "sentence",
                prevEl.childrenIds[m.oldIndex]
              )[0]
            );
          } else {
            childIds.push(addSentence(part));
          }
        }
      } else {
        childIds = sentenceTexts.map((s) => addSentence(s));
      }
      let paragraphElement = addElementFn(
        paragraphContents,
        "paragraph",
        childIds
      );
      childIds.forEach((cid) => this.parentMap.set(cid, paragraphElement));
      return paragraphElement;
    };

    const addDocument = (documentContents: string, prevId?: Id): Id => {
      const paragraphTexts = this._splitContents(documentContents, "paragraph");
      let childIds: Id[] = [];
      if (prevId) {
        const prevEl = this.getElement(prevId);
        const prevParas = prevEl.childrenIds.map((cid) =>
          this.computeFullContents(cid)
        );

        // Match new paragraphs against the previous document's children so we
        // can reuse entire paragraphs when possible.
        const matches = greedyMatchParts(
          prevEl.childrenIds.map((id, i) => ({ id, text: prevParas[i] })),
          paragraphTexts,
          (t: string) => this._splitContents(t, "sentence"),
          0.25
        );
        for (let i = 0; i < matches.length; i++) {
          const m = matches[i];
          const part = paragraphTexts[i];
          if (m.oldIndex != null && m.exact) {
            childIds.push(prevEl.childrenIds[m.oldIndex]);
          } else if (m.oldIndex != null) {
            // Partial match — reparse with the old paragraph so its sentences
            // and words can be reused when possible.
            childIds.push(
              this._parseContentsToElements(
                part,
                "paragraph",
                prevEl.childrenIds[m.oldIndex]
              )[0]
            );
          } else {
            childIds.push(addParagraph(part));
          }
        }
      } else {
        childIds = paragraphTexts.map((p) => addParagraph(p));
      }
      let documentElement = addElementFn(
        documentContents,
        "document",
        childIds
      );
      childIds.forEach((cid) => this.parentMap.set(cid, documentElement));
      return documentElement;
    };

    if (kind === "word") {
      return [previousId && contents === prevFullContents
        ? previousId
        : addElementFn(contents, "word")];
    } else if (kind === "sentence") {
      return [addSentence(contents, previousId)];
    } else if (kind === "paragraph") {
      return [addParagraph(contents, previousId)];
    } else if (kind === "document") {
      return [addDocument(contents, previousId)];
    } else {
      throw new Error(`Unknown element kind: ${kind}`);
    }
  }

  /**
   * We've created one or more new elements to replace an existing one, and need to update the parent. This function handles one level of that.
   *
   * Take the id of the original child and a list of new child ids. Both must already exist in the store.
   * TODO: check about annotation-related invariants when I add those.
   * What it does:
   * - Find the parent of the original child.
   * - Make a new parent element with the updated children, add it to the store.
   * - Update the parentMap to point the new child ids to the new parent.
   * @returns the new parent Element.
   *
   * **Note: not recursive!** Caller will need to call again to update the parent's parent, until you reach the root element.
   * TODO: what about annotations?
   */
  _replaceParent(oldChildId: Id, replacementChildIds: Id[]): Element {
    const oldParentId: Id = getOrThrow(this.parentMap, oldChildId);
    // console.log(
    //   `Replacing ${oldChildId} with [${replacementChildIds.join(
    //     ", "
    //   )}] in parent ${oldParentId}`
    // );
    if (!oldParentId) {
      throw new Error(`Element with id ${oldChildId} has no parent`);
    }
    const oldParent = this.getElement(oldParentId);
    if (!oldParent) {
      throw new Error(`Parent element with id ${oldParentId} not found`);
    }
    const { addElement } = this._store.getState();

    // Create a new parent element with the updated child ids in place of the old child id in the parent's childrenIds.
    let newChildrenIds = oldParent.childrenIds.flatMap((cid) =>
      cid === oldChildId ? replacementChildIds : [cid]
    );

    // console.log(`oldParent.childrenIds: ${oldParent.childrenIds}`);
    // console.log(`newChildrenIds: ${newChildrenIds}`);

    let newParent = {
      ...oldParent,
      id: myNanoid(),
      childrenIds: newChildrenIds,
      createdAt: new Date(),
    };
    // Add the new parent to the store
    addElement(newParent);
    // Update the parentMap for the new children
    newChildrenIds.forEach((cid) => {
      // console.log(`Setting parentMap(${cid}) = ${newParent.id}`);
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

    if (el.kind === "document") {
      throw new Error("Cannot delete document element");
    }

    // Replace with empty list to remove it from the parent's childrenIds.
    // This will bubble up to the root element, creating a new version.
    this._replaceElement(el, []);
  }

  computeFullContents(id: Id): string {
    const el = this.getElement(id);
    if (el.kind === "word") {
      return el.contents ?? "";
    }
    const childTexts = el.childrenIds.map((cid) =>
      this.computeFullContents(cid)
    );
    if (el.kind === "document") {
      return childTexts.join("\n\n");
    }
    // sentence or paragraph
    return childTexts.join(" ");
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

  // Debugging utilities

  checkInvariants(): void {
    this.validateParentMap();
  }

  /**
   * Check the parent map for inconsistencies. Log any inconsistencies found.
   */
  validateParentMap(): void {
    // Go through every element in the document, check that its parent is correct
    let check = (el: Element) => {
      const children = el.childrenIds.map((id) => this.getElement(id));
      for (const child of children) {
        const parentId = this.parentMap.get(child.id);
        if (parentId !== el.id) {
          console.log(
            `Inconsistency: parentMap(${child.id}) = ${parentId}, actual ${el.id}`
          );
        }
        check(child); // recurse
      }
    };
    const root = this.getRootElement();
    check(root);
  }

  logDocStructure(): void {
    const log = (el: Element, indent = 0) => {
      console.log(
        `${" ".repeat(indent)}${el.kind} ${el.id} ${
          el.kind === "word" ? '"' + el.contents + '"' : ""
        }`
      );
      el.childrenIds.forEach((id) => log(this.getElement(id), indent + 2));
    };
    const root = this.getRootElement();
    log(root);
  }
}

const sampleText = `Tarragon was bored. He had planned to play with his toy spaceship, but Ginny broke it yesterday. Ginny was a weasel. She had orange fur, a lot of energy, and was Tarragon's best friend of all time.

The weather outside was absolutely perfect for space adventures under the tall redwoods. The sun had just risen over the hills in the distance, lighting up the scattered clouds. Taraggon had just finished his breakfast of scrumptious savory french toast with green herbs, shredded mozzarella, and snail sauce, and now he had nothing to do.

“I need to find someone to play with”, said Tarragon to himself. “Let's see if Paper the Squirrel or Ginny want to have an adventure.”

Tarragon put on his white astronaut's jacket with a spaceship logo on the left shoulder and yellow loops for attaching items during spacewalks. He took the space-shuttle bag he always had with him and walked outside, pushed closed the door behind him, and hurried off to look for Paper the squirrel.

The light flickered between the tall trunks and upper branches of the redwoods as he walked toward the tree where Paper the Squirrel lived.`;

export const docModel = new DocumentModel(useDocStore, sampleText);

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
