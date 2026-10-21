import { describe, expect, it } from "vitest";
import { computeModification, type CopiedQuestion, type SourceQuestion } from "./attribution";

const originals: SourceQuestion[] = [1, 2, 3, 4].map((n) => ({
  id: `s${n}`, prompt: `Question ${n}`, answer: `Answer ${n}`, options: ["a", "b"],
}));
const exactCopy = (): CopiedQuestion[] => originals.map((o) => ({ ...o, sourceQuestionId: o.id }));

describe("computeModification", () => {
  it("keeps attribution for an unchanged copy", () => {
    const r = computeModification(originals, exactCopy());
    expect(r).toMatchObject({ modifiedCount: 0, removeAttribution: false });
  });
  it("ignores whitespace and case-only differences", () => {
    const copy = exactCopy();
    copy[0] = { ...copy[0]!, prompt: "  question   1 " };
    expect(computeModification(originals, copy).modifiedCount).toBe(0);
  });
  it("keeps attribution at exactly 50% (must be MORE than 50%)", () => {
    const copy = exactCopy();
    copy[0] = { ...copy[0]!, answer: "changed" };
    copy[1] = { ...copy[1]!, answer: "changed" };
    const r = computeModification(originals, copy);
    expect(r.ratio).toBe(0.5);
    expect(r.removeAttribution).toBe(false);
  });
  it("removes attribution above 50%", () => {
    const copy = exactCopy();
    for (const i of [0, 1, 2]) copy[i] = { ...copy[i]!, prompt: "rewritten" };
    expect(computeModification(originals, copy).removeAttribution).toBe(true);
  });
  it("counts deleted originals as modified", () => {
    const copy = exactCopy().slice(0, 1);
    const r = computeModification(originals, copy);
    expect(r.modifiedCount).toBe(3);
    expect(r.removeAttribution).toBe(true);
  });
  it("does not let added questions dilute or trigger removal", () => {
    const copy: CopiedQuestion[] = [
      ...exactCopy(),
      ...Array.from({ length: 20 }, (_, i) => ({ sourceQuestionId: null, prompt: `new ${i}`, answer: "x" })),
    ];
    expect(computeModification(originals, copy).removeAttribution).toBe(false);
  });
  it("handles an empty source deck", () => {
    expect(computeModification([], []).removeAttribution).toBe(false);
  });
});
