// import { create } from "zustand";
// import { DocumentModel } from "./document";
// import { DocumentVersion } from "./types";

// type DocState = {
//   model: DocumentModel | null;
//   load: (version: DocumentVersion) => void;
// };

// export const useDocStore = create<DocState>((set, get) => ({
//   model: null,
//   load: (version) => {
//     set({ model: new DocumentModel(version) });
//   },
//   // applyDelta: (delta) => {
//   //   const model = get().model;
//   //   if (!model) return;
//   //   const newModel = model.applyDelta(delta);
//   //   set({ model: newModel });
//   // },
// }));

/**
 * See state.md for data model
 */

import { create } from "zustand";
import type { StateCreator } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, devtools, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import type { Id } from "@/utils/nanoid";
import type { Draft } from "immer";
import type {
  Element,
  Annotation,
  DocumentVersion,
  ElementAnnotation,
} from "./types";

// --- Zustand Store Definition ---
export interface DocState {
  // normalized raw data maps
  elements: Record<Id, Element>;
  annotations: Record<Id, Annotation>;
  elementAnnotations: ElementAnnotation[];
  versions: Record<number, DocumentVersion>;
  currentVersionNumber: number | null;
  nextVersionNumber: number; // so max version so far is nextVersionNumber - 1

  // selectors
  getElement: (id: Id) => Element | undefined;
  getAllElements: () => Element[];
  getAnnotation: (id: Id) => Annotation | undefined;
  getAllAnnotations: () => Annotation[];
  getAllElementAnnotations: () => ElementAnnotation[];

  // mutators
  addElement: (el: Element) => Id;
  addElements: (els: Element[]) => Id[];
  // for now, no update or remove methods —- immutable, append-only model.
  // Can add garbage collection later if I end up with too many versions.

  // annotations are also append-only and immutable
  addAnnotation: (ann: Annotation, targetId: Id) => Id;
  // For now, only add one at a time. Add bulk later if needed.

  addElementAnnotation: (elAnn: ElementAnnotation) => void;
  updateElementAnnotationValidity: (
    elementId: Id,
    annotationId: Id,
    validThroughVersion: number
  ) => void;

  switchCurrentVersion: (versionNumber: number) => void;

  // Creates a new version with the given rootId, returning the new version number
  addVersion: (rootId: Id) => number;
}

const createState: StateCreator<
  DocState,
  [["zustand/immer", never]],
  [],
  DocState
> = (set, get) => ({
  elements: {},
  annotations: {},
  elementAnnotations: [],
  versions: {},
  currentVersionNumber: null,
  nextVersionNumber: 1,

  // selectors
  getElement: (id) => get().elements[id],
  getAllElements: () => Object.values(get().elements),
  getAnnotation: (id) => get().annotations[id],
  getAllAnnotations: () => Object.values(get().annotations),
  getAllElementAnnotations: () => get().elementAnnotations,

  // mutators
  addElement: (el: Element) => {
    set((state) => {
      state.elements[el.id] = el;
    });
    return el.id;
  },

  addElements: (els) => {
    const ids: Id[] = [];
    set((state) => {
      els.forEach((el) => {
        state.elements[el.id] = el;
        ids.push(el.id);
      });
    });
    return ids;
  },

  addAnnotation: (
    { id, previousVersionId, kind, contents, status, createdAt },
    targetId
  ) => {
    set((state) => {
      state.annotations[id] = {
        id,
        previousVersionId,
        kind,
        contents,
        status,
        createdAt,
      };
    });
    set((state) => {
      state.elementAnnotations.push({
        elementId: targetId,
        annotationId: id,
        validFromVersion: state.currentVersionNumber ?? 0,
        validThroughVersion: null, // starts null, gets set later
      });
    });
    return id;
  },

  addElementAnnotation: (ellAn) => {
    set((state) => {
      state.elementAnnotations.push(ellAn);
    });
  },

  updateElementAnnotationValidity: (
    elementId,
    annotationId,
    validThroughVersion
  ) => {
    // Import Draft from immer at the top of your file:

    // Then, annotate the state parameter in your set callback:
    set((state: Draft<DocState>) => {
      const elAnn = state.elementAnnotations.find(
        (ea) => ea.elementId === elementId && ea.annotationId === annotationId
      );
      if (!elAnn) {
        throw new Error(
          `ElementAnnotation not found for element ${elementId} and annotation ${annotationId}`
        );
      }
      elAnn.validThroughVersion = validThroughVersion;
    });
  },

  switchCurrentVersion: (versionNumber) => {
    set((state) => {
      if (!state.versions[versionNumber]) {
        throw new Error(`Version ${versionNumber} does not exist`);
      }
      state.currentVersionNumber = versionNumber;
    });
  },

  addVersion: (rootId) => {
    let newVer: number;
    set((state) => {
      newVer = state.nextVersionNumber;
      state.versions[newVer] = {
        id: `${newVer}`,
        rootId,
        docVersionNumber: newVer,
        formatVersion: "1.0",
      };
      state.currentVersionNumber = newVer;
      state.nextVersionNumber += 1;
    });
    return newVer!;
  },
});

function createMemoryStorage(): StateStorage {
  const store: Record<string, string> = {};
  return {
    getItem: (name) => (name in store ? store[name] : null),
    setItem: (name, value) => {
      store[name] = value;
    },
    removeItem: (name) => {
      delete store[name];
    },
  };
}

export function createDocStore(options: { storage?: StateStorage } = {}) {
  const storage =
    options.storage ??
    (typeof window === "undefined"
      ? createMemoryStorage()
      : window.localStorage);
  return create<DocState>()(
    devtools(
      persist(immer(createState), {
        name: "document-store",
        version: 1,
        storage: createJSONStorage(() => storage),
      })
    )
  );
}

export const useDocStore = createDocStore();
