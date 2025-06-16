// This file is responsible for managing the state of the nodes and edges in the React Flow diagram.
// It uses Zustand for state management and provides functions to handle changes to nodes and edges.
import { create } from "zustand";
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

type Store = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
};

export const useStore = create<Store>((set) => ({
  nodes: [
    {
      id: "1",
      position: { x: 0, y: 0 },
      data: { label: "Hello World" },
      type: "default",
    },
  ],
  edges: [],
  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
}));

export default useStore;
