import { describe, it, expect } from "vitest";
import { greedyMatchParts, isReorderedSameParts } from "./reuse-utils";

const tokenizer = (t: string) => t.split(/\s+/).filter(Boolean);

describe("reuse utils", () => {
  it("detects reorder", () => {
    expect(isReorderedSameParts(["A", "B"], ["B", "A"]))
      .toBe(true);
    expect(isReorderedSameParts(["A", "B"], ["A", "B"]))
      .toBe(false);
    expect(isReorderedSameParts(["A"], ["B", "A"]))
      .toBe(false);
  });

  it("matches parts with insertions", () => {
    const oldParts = [
      { id: "1", text: "A" },
      { id: "2", text: "B" },
    ];
    const res = greedyMatchParts(oldParts, ["X", "A", "B"], tokenizer);
    expect(res.map((r) => r.oldIndex)).toEqual([null, 0, 1]);
    expect(res.map((r) => r.exact)).toEqual([false, true, true]);
  });

  it("does not reuse when reordered", () => {
    const oldParts = [
      { id: "1", text: "A" },
      { id: "2", text: "B" },
      { id: "3", text: "C" },
    ];
    const res = greedyMatchParts(oldParts, ["C", "B", "A"], tokenizer);
    expect(res.map((r) => r.oldIndex)).toEqual([null, null, null]);
  });

  it("partially matches by overlap", () => {
    const oldParts = [
      { id: "1", text: "Nice to meet you." },
    ];
    const res = greedyMatchParts(oldParts, ["Very nice to meet you."], tokenizer);
    expect(res[0].oldIndex).toBe(0);
    expect(res[0].exact).toBe(false);
  });
});
