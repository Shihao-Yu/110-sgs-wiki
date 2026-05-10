import { describe, expect, it } from "vitest";
import { validateGeneralPatch, validateSkillPatch, validateFaqInput, validateSessionInput, MAX_TEXT_LEN } from "./validators.js";

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

describe("validateSessionInput", () => {
  const empty = { name: "", generals: [null, null] as [null, null] };
  const baseValid = {
    ifRevision: 0,
    playerCount: 3,
    players: [empty, empty, empty],
  };

  it("accepts a valid empty session", () => {
    expect(validateSessionInput(baseValid).ok).toBe(true);
  });

  it("accepts a session with generals", () => {
    const v = {
      ifRevision: 5,
      playerCount: 2,
      players: [
        { name: "A", generals: ["general_caocao", "general_xiahoudun"] as [string, string] },
        { name: "B", generals: ["general_liubei", null] as [string, null] },
      ],
    };
    expect(validateSessionInput(v).ok).toBe(true);
  });

  it("rejects ifRevision negative", () => {
    expect(validateSessionInput({ ...baseValid, ifRevision: -1 }).ok).toBe(false);
  });
  it("rejects ifRevision missing", () => {
    expect(validateSessionInput({ playerCount: 3, players: [empty, empty, empty] }).ok).toBe(false);
  });
  it("rejects playerCount = 1", () => {
    expect(validateSessionInput({ ...baseValid, playerCount: 1, players: [empty] }).ok).toBe(false);
  });
  it("rejects playerCount = 13", () => {
    expect(validateSessionInput({ ...baseValid, playerCount: 13, players: Array(13).fill(empty) }).ok).toBe(false);
  });
  it("accepts playerCount = 12", () => {
    expect(validateSessionInput({ ...baseValid, playerCount: 12, players: Array(12).fill(empty) }).ok).toBe(true);
  });
  it("rejects mismatched players length", () => {
    expect(validateSessionInput({ ...baseValid, playerCount: 5, players: [empty, empty] }).ok).toBe(false);
  });
  it("rejects duplicate generals across players", () => {
    const v = {
      ifRevision: 0,
      playerCount: 2,
      players: [
        { name: "", generals: ["general_caocao", null] as [string, null] },
        { name: "", generals: ["general_caocao", null] as [string, null] },
      ],
    };
    const r = validateSessionInput(v);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.path.includes("generals") && e.message.includes("已被"))).toBe(true);
  });
  it("rejects bad general id pattern", () => {
    const v = {
      ifRevision: 0,
      playerCount: 1,
      players: [{ name: "", generals: ["not_a_general", null] as [string, null] }],
    };
    expect(validateSessionInput({ ...v, playerCount: 2, players: [v.players[0]!, empty] }).ok).toBe(false);
  });
  it("rejects player.name over 50 chars", () => {
    const v = { ...baseValid, players: [{ name: "x".repeat(51), generals: [null, null] as [null, null] }, empty, empty] };
    expect(validateSessionInput(v).ok).toBe(false);
  });
  it("rejects generals not length-2 array", () => {
    const v = { ...baseValid, players: [{ name: "", generals: [null] as unknown as [null, null] }, empty, empty] };
    expect(validateSessionInput(v).ok).toBe(false);
  });
});
