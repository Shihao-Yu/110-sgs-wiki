import { describe, expect, it } from "vitest";
import { validateGeneralPatch, validateSkillPatch, validateFaqInput, MAX_TEXT_LEN } from "./validators.js";

describe("validateGeneralPatch", () => {
  const valid = {
    name: "曹操", title: "魏武帝", faction: "WEI",
    hp: 4, maxHp: 4, gender: "male",
    skills: ["skill_jianxiong"], image: "/img/x.png", pack: "标准版",
  };
  it("accepts valid", () => expect(validateGeneralPatch(valid).ok).toBe(true));
  it("rejects unknown faction", () => {
    const r = validateGeneralPatch({ ...valid, faction: "ZZZ" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.path === "faction")).toBe(true);
  });
  it("rejects HP=0 and HP=20", () => {
    expect(validateGeneralPatch({ ...valid, hp: 0 }).ok).toBe(false);
    expect(validateGeneralPatch({ ...valid, hp: 20 }).ok).toBe(false);
  });
  it("rejects hp > maxHp", () => {
    expect(validateGeneralPatch({ ...valid, hp: 5, maxHp: 4 }).ok).toBe(false);
  });
  it("rejects empty name", () => expect(validateGeneralPatch({ ...valid, name: "" }).ok).toBe(false));
  it("rejects gender not in enum", () => expect(validateGeneralPatch({ ...valid, gender: "other" }).ok).toBe(false));
  it("rejects pairedNames non-array", () => {
    expect(validateGeneralPatch({ ...valid, pairedNames: "x" as unknown as string[] }).ok).toBe(false);
  });
  it("rejects unknown subfaction", () => {
    expect(validateGeneralPatch({ ...valid, subfaction: "ZZZ" }).ok).toBe(false);
  });
  it("rejects image with javascript: scheme", () => {
    const r = validateGeneralPatch({ ...valid, image: "javascript:alert(1)" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.path === "image")).toBe(true);
  });
  it("rejects image with data: scheme", () => {
    expect(validateGeneralPatch({ ...valid, image: "data:text/html,<script>" }).ok).toBe(false);
  });
  it("accepts image with absolute http", () => {
    expect(validateGeneralPatch({ ...valid, image: "https://example.com/x.png" }).ok).toBe(true);
  });
  it("accepts image with site-relative path", () => {
    expect(validateGeneralPatch({ ...valid, image: "/img/x.png" }).ok).toBe(true);
  });
  it("rejects null/undefined input", () => {
    expect(validateGeneralPatch(null).ok).toBe(false);
    expect(validateGeneralPatch(undefined).ok).toBe(false);
  });
});

describe("validateSkillPatch", () => {
  const valid = { name: "奸雄", description: "当你受到伤害后...", type: "passive", timing: ["damaged"] };
  it("accepts valid", () => expect(validateSkillPatch(valid).ok).toBe(true));
  it("rejects unknown type", () => expect(validateSkillPatch({ ...valid, type: "foo" }).ok).toBe(false));
  it("rejects empty description", () => expect(validateSkillPatch({ ...valid, description: "" }).ok).toBe(false));
  it("rejects non-array timing", () => expect(validateSkillPatch({ ...valid, timing: "x" as unknown as string[] }).ok).toBe(false));
  it("rejects description over MAX_TEXT_LEN", () => {
    const long = "a".repeat(MAX_TEXT_LEN + 1);
    expect(validateSkillPatch({ ...valid, description: long }).ok).toBe(false);
  });
});

describe("validateFaqInput", () => {
  const valid = { question: "?", answer: "!", category: "rule", relatedGeneralIds: ["general_caocao"] };
  it("accepts valid", () => expect(validateFaqInput(valid).ok).toBe(true));
  it("accepts empty relatedGeneralIds", () => expect(validateFaqInput({ ...valid, relatedGeneralIds: [] }).ok).toBe(true));
  it("rejects missing question", () => expect(validateFaqInput({ ...valid, question: "" }).ok).toBe(false));
  it("rejects v1-disallowed category 'card'", () => {
    expect(validateFaqInput({ ...valid, category: "card" }).ok).toBe(false);
  });
  it("rejects v1-disallowed category 'skill'", () => {
    expect(validateFaqInput({ ...valid, category: "skill" }).ok).toBe(false);
  });
  it("accepts category 'general' and 'rule'", () => {
    expect(validateFaqInput({ ...valid, category: "general" }).ok).toBe(true);
    expect(validateFaqInput({ ...valid, category: "rule" }).ok).toBe(true);
  });
  it("rejects question over MAX_TEXT_LEN", () => {
    expect(validateFaqInput({ ...valid, question: "a".repeat(MAX_TEXT_LEN + 1) }).ok).toBe(false);
  });
});
