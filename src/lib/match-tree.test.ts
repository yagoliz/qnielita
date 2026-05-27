import { describe, it, expect } from "vitest";
import { buildMatchTree } from "./match-tree";

describe("buildMatchTree", () => {
  it("returns empty tree for empty input", () => {
    const tree = buildMatchTree([], [], []);
    expect(tree.groupStage.groups).toEqual([]);
    expect(tree.knockout).toEqual([]);
  });
});