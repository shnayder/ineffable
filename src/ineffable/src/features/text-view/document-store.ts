import { create } from "zustand";
import { DocumentModel } from "./document";
import { DocumentVersion } from "./types";

type DocState = {
  model: DocumentModel | null;
  load: (version: DocumentVersion) => void;
};

export const useDocStore = create<DocState>((set, get) => ({
  model: null,
  load: (version) => {
    set({ model: new DocumentModel(version) });
  },
  // applyDelta: (delta) => {
  //   const model = get().model;
  //   if (!model) return;
  //   const newModel = model.applyDelta(delta);
  //   set({ model: newModel });
  // },
}));
