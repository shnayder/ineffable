import { Id, myNanoid } from "@/utils/nanoid";
import { useDocStore } from "./document-store";
import {
  Annotation,
  Element,
  DocumentVersion,
  ElementKind,
  getChildKind,
} from "./types";
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

  /**
   * Return all annotations that are active for the given element in the current
   * document version.
   */
  getAnnotationsFor(elementId: Id): Annotation[] {
    const state = this._store.getState();
    const curVer = state.currentVersionNumber;
    if (curVer == null) return [];
    // TODO: once we have lots of annotations, will want to use a DB query instead of loading entire list
    const anns = state
      .getAllElementAnnotations()
      .filter(
        (ea) =>
          ea.elementId === elementId &&
          ea.validFromVersion <= curVer &&
          (ea.validThroughVersion == null || curVer <= ea.validThroughVersion)
      )
      .map((ea) => state.getAnnotation(ea.annotationId)!)
      .filter(Boolean);
    return anns;
  }

  /* Versioning */

  getCurrentVersionNumber(): number {
    const state = this._store.getState();
    const num = state.currentVersionNumber;
    if (num === null) {
      // This should not happen after constructor
      throw new Error("No current version number set");
    }
    return num;
  }

  getLatestVersionNumber(): number {
    const state = this._store.getState();
    return state.nextVersionNumber - 1;
  }

  switchToVersion(versionNumber: number): void {
    this._store.getState().switchCurrentVersion(versionNumber);
    this.rebuildCaches();
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
    if (!newContents || newContents.trim() === "") {
      throw new Error(
        "New contents cannot be empty. Use deleteElement to remove."
      );
    }
    const oldElement = this.getElement(origElementId);
    if (!oldElement) {
      throw new Error(`Element with id ${origElementId} not found`);
    }
    // Create new element or elements, adding them to the store and updating the parentMap where needed.
    const newElementIds: Id[] = this._parseContentsToElements(
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
    const origElementId = origElement.id;
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
   * Helper to create a new element and add it to the store.
   */
  private _createElement(
    kind: ElementKind,
    contents: string,
    childrenIds: Id[] = []
  ): Id {
    const { addElement } = this._store.getState();
    const element = {
      id: myNanoid(),
      kind,
      contents: kind === "word" ? contents : "",
      childrenIds,
      createdAt: new Date(),
    };
    addElement(element);
    return element.id;
  }

  /**
   * Helper to match and reuse children for a given level (word, sentence, paragraph).
   * Returns an array of child Ids (reused or new as needed).
   *
   * @param kind The kind of the parent element (sentence, paragraph, etc.)
   * @param newParts The new parts of the contents to match against existing children.
   * @param prevChildrenIds The Ids of the previous children to match against.
   */
  private _matchAndReuseChildren(
    kind: ElementKind,
    newParts: string[],
    prevChildrenIds: Id[] = []
  ): Id[] {
    const childKind = getChildKind(kind);
    if (!prevChildrenIds.length) {
      // No previous children, just create new
      return newParts.map(
        (part) => this._parseContentsToElements(part, childKind)[0]
      );
    }
    // Compute full contents for each previous child
    const prevChildContents = prevChildrenIds.map((cid) =>
      this.computeFullContents(cid)
    );
    // Use greedyMatchParts to find best matches
    const matches = greedyMatchParts(
      prevChildrenIds.map((id, i) => ({ id, text: prevChildContents[i] })),
      newParts,
      (t: string) =>
        childKind === "word"
          ? [t]
          : this._splitContents(
              t,
              childKind === "sentence" ? "word" : "sentence"
            ),
      0.25
    );
    const childIds: Id[] = [];
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const part = newParts[i];
      if (m.oldIndex != null && m.exact) {
        childIds.push(prevChildrenIds[m.oldIndex]);
      } else if (m.oldIndex != null) {
        // Partial match — recursively parse with the old child to reuse subchildren
        childIds.push(
          this._parseContentsToElements(
            part,
            childKind,
            prevChildrenIds[m.oldIndex]
          )[0]
        );
      } else {
        childIds.push(this._parseContentsToElements(part, childKind)[0]);
      }
    }
    return childIds;
  }

  /**
   * Parses a string of text for an element into a list of new Element objects.
   * Handles splitting, matching, and recursive reuse for all levels.
   */
  _parseContentsToElements(
    contents: string,
    kind: Element["kind"],
    previousId?: Id
  ): Id[] {
    const contentParts = this._splitContents(contents, kind);
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
    // Single part - handle by kind
    if (kind === "word") {
      if (previousId && contents === prevFullContents) {
        return [previousId];
      }
      return [this._createElement("word", contents)];
    }
    // For sentence, paragraph, document: recursively match and reuse children
    const newChildParts = this._splitContents(contents, getChildKind(kind));
    const childIds = this._matchAndReuseChildren(
      kind,
      newChildParts,
      prevChildrenIds
    );
    const newId = this._createElement(kind, contents, childIds);
    childIds.forEach((cid) => this.parentMap.set(cid, newId));
    return [newId];
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
      throw new Error(`Element with id ${oldParentId} not found`);
    }
    const newChildrenIds = oldParent.childrenIds.flatMap((cid) =>
      cid === oldChildId ? replacementChildIds : [cid]
    );
    const newParent = {
      ...oldParent,
      id: myNanoid(),
      childrenIds: newChildrenIds,
      createdAt: new Date(),
    };
    this._store.getState().addElement(newParent);
    newChildrenIds.forEach((cid) => this.parentMap.set(cid, newParent.id));
    return newParent;
  }

  /**
   * Adds a new element after a given element.
   * @param prevElementId The ID of the element to add the new element after.
   * @param toAdd The string contents of the new element to add.
   */
  addAfter(prevElementId: Id, toAdd: string): void {
    const prevElement = this.getElement(prevElementId);
    if (prevElement.kind === "document") {
      throw new Error("Cannot add an element after the root document element.");
    }

    const newElementIds = this._parseContentsToElements(
      toAdd,
      prevElement.kind
    );
    if (newElementIds.length === 0) {
      console.warn("No new elements were created from the provided content.");
      return;
    }

    const parentId = this.parentMap.get(prevElementId);
    if (!parentId) {
      throw new Error(`Element with id ${prevElementId} has no parent.`);
    }
    const parent = this.getElement(parentId);

    const newChildrenIds = [...parent.childrenIds];
    const prevIndex = newChildrenIds.indexOf(prevElementId);
    if (prevIndex === -1) {
      throw new Error(
        `Element ${prevElementId} not found in parent ${parentId}.`
      );
    }
    newChildrenIds.splice(prevIndex + 1, 0, ...newElementIds);

    const newParentEl = {
      ...parent,
      id: myNanoid(),
      childrenIds: newChildrenIds,
      createdAt: new Date(),
    };
    this._store.getState().addElement(newParentEl);
    newChildrenIds.forEach((cid) => this.parentMap.set(cid, newParentEl.id));

    this._replaceElement(parent, [newParentEl.id]);
  }

  /**
   * Deletes an element. This will also delete all its children.
   * Internally, creates a new version where this element is removed from the parent's childrenIds. The element will not be removed from the store, so it can still be accessed in previous versions.
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

    const parentId = this.parentMap.get(id);
    if (!parentId) {
      // This can happen if we are deleting an element whose parent is also being deleted in the same operation.
      // In that case, we can consider the element already deleted.
      return;
    }
    const parent = this.getElement(parentId);
    const newChildrenIds = parent.childrenIds.filter((cid) => cid !== id);

    if (newChildrenIds.length === 0 && parent.kind !== "document") {
      this.deleteElement(parentId);
    } else {
      // Replace with empty list to remove it from the parent's childrenIds.
      // This will bubble up to the root element, creating a new version.
      this._replaceElement(el, []);
    }
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

  /**
   * Add a new annotation to the given element. Creates a new document version
   * and returns the new annotation id.
   */
  addAnnotation(elementId: Id, kind: Annotation["kind"], contents: string): Id {
    const state = this._store.getState();
    const rootId = this.getRootElement().id;
    // bump doc version first
    state.addVersion(rootId);
    const id = myNanoid();
    const ann: Annotation = {
      id,
      previousVersionId: "",
      kind,
      contents,
      status: "open",
      createdAt: new Date(),
    };
    state.addAnnotation(ann, elementId);
    return id;
  }

  /**
   * Create a new version of an annotation with updated contents.
   * Returns the id of the new annotation.
   */
  updateAnnotation(annotationId: Id, newContents: string): Id {
    const state = this._store.getState();
    const oldAnn = state.getAnnotation(annotationId);
    if (!oldAnn) {
      throw new Error(`Annotation ${annotationId} not found`);
    }
    const mapping = state
      .getAllElementAnnotations()
      .find(
        (ea) =>
          ea.annotationId === annotationId && ea.validThroughVersion == null
      );
    if (!mapping) {
      throw new Error(
        `Active mapping for annotation ${annotationId} not found`
      );
    }
    // mark old mapping as no longer valid at current version
    const curVer = state.currentVersionNumber ?? 0;
    state.updateElementAnnotationValidity(
      mapping.elementId,
      annotationId,
      curVer
    );

    // bump version and create new annotation
    const rootId = this.getRootElement().id;
    state.addVersion(rootId);

    const newId = myNanoid();
    const newAnn: Annotation = {
      id: newId,
      previousVersionId: annotationId,
      kind: oldAnn.kind,
      contents: newContents,
      status: oldAnn.status,
      createdAt: new Date(),
    };
    state.addAnnotation(newAnn, mapping.elementId);
    return newId;
  }

  /**
   * Change the status of an annotation by creating a new version with the new
   * status.
   */
  changeAnnotationStatus(
    annotationId: Id,
    newStatus: Annotation["status"]
  ): Id {
    const state = this._store.getState();
    const oldAnn = state.getAnnotation(annotationId);
    if (!oldAnn) {
      throw new Error(`Annotation ${annotationId} not found`);
    }
    const mapping = state
      .getAllElementAnnotations()
      .find(
        (ea) =>
          ea.annotationId === annotationId && ea.validThroughVersion == null
      );
    if (!mapping) {
      throw new Error(
        `Active mapping for annotation ${annotationId} not found`
      );
    }
    const curVer = state.currentVersionNumber ?? 0;
    state.updateElementAnnotationValidity(
      mapping.elementId,
      annotationId,
      curVer
    );

    const rootId = this.getRootElement().id;
    state.addVersion(rootId);

    const newId = myNanoid();
    const newAnn: Annotation = {
      id: newId,
      previousVersionId: annotationId,
      kind: oldAnn.kind,
      contents: oldAnn.contents,
      status: newStatus,
      createdAt: new Date(),
    };
    state.addAnnotation(newAnn, mapping.elementId);
    return newId;
  }

  /**
   * Delete an annotation by ending its validity and bumping the document
   * version. No new annotation is created.
   */
  deleteAnnotation(annotationId: Id): void {
    const state = this._store.getState();
    const mapping = state
      .getAllElementAnnotations()
      .find(
        (ea) =>
          ea.annotationId === annotationId && ea.validThroughVersion == null
      );
    if (!mapping) {
      throw new Error(
        `Active mapping for annotation ${annotationId} not found`
      );
    }
    const curVer = state.currentVersionNumber ?? 0;
    state.updateElementAnnotationValidity(
      mapping.elementId,
      annotationId,
      curVer
    );
    const rootId = this.getRootElement().id;
    state.addVersion(rootId);
  }

  // Debugging utilities

  checkInvariants(): void {
    this.validateParentMap();
  }

  /**
   * Check the parent map for inconsistencies. Log any inconsistencies found.
   */
  validateParentMap(): void {
    // Go through every element in the document, check that its parent is correct
    const check = (el: Element) => {
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

export function useAnnotations(elementId: Id): Annotation[] {
  return useDocStore((s) => {
    const curVer = s.currentVersionNumber;
    if (curVer == null) return [];

    const state = s;
    const anns = state
      .getAllElementAnnotations()
      .filter(
        (ea) =>
          ea.elementId === elementId &&
          ea.validFromVersion <= curVer &&
          (ea.validThroughVersion == null || curVer <= ea.validThroughVersion)
      )
      .map((ea) => state.getAnnotation(ea.annotationId)!)
      .filter(Boolean);
    return anns;
  });
}
