import { describe, expect, it, beforeEach, vi, afterAll } from "vitest";
import type { General, Skill, FAQ, GeneralId, SkillId, FAQId } from "@sgs/data";

const mem = new Map<string, string>();
let throwOnGet = false;
let throwOnMget = false;

vi.mock("@upstash/redis", () => {
  return {
    Redis: class {
      async get(key: string) {
        if (throwOnGet) throw new Error("simulated upstash failure");
        const v = mem.get(key);
        return v ? JSON.parse(v) : null;
      }
      async set(key: string, value: unknown) { mem.set(key, JSON.stringify(value)); }
      async del(key: string) { mem.delete(key); }
      async mget(...keys: string[]) {
        if (throwOnMget) throw new Error("simulated upstash failure");
        return keys.map((k) => {
          const v = mem.get(k);
          return v ? JSON.parse(v) : null;
        });
      }
    },
  };
});

const ENV_BAK = { ...process.env };
beforeEach(() => {
  mem.clear();
  throwOnGet = false;
  throwOnMget = false;
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
});
afterAll(() => { Object.assign(process.env, ENV_BAK); });

import { entityStore, __resetForTests } from "./entity-store.js";

beforeEach(() => __resetForTests());

const G = (id: string, name: string): General => ({
  id: id as GeneralId, name, title: "T", faction: "WEI" as General["faction"], hp: 4, maxHp: 4,
  gender: "male" as General["gender"], skills: [], image: "", pack: "p",
}) as General;

const S = (id: string, name: string, generalIds: string[]): Skill => ({
  id: id as SkillId, name, description: "d", type: "passive" as Skill["type"],
  timing: [], generalIds: generalIds as unknown as Skill["generalIds"], faq: [],
}) as Skill;

const F = (id: string, q: string, generalIds: string[]): FAQ => ({
  id: id as FAQId, question: q, answer: "a", category: "rule" as FAQ["category"],
  relatedGeneralIds: generalIds as unknown as FAQ["relatedGeneralIds"],
}) as FAQ;

describe("entityStore round-trip", () => {
  it("putGeneral / getGeneral", async () => {
    await entityStore.putGeneral("g1" as GeneralId, G("g1", "曹操"));
    expect((await entityStore.getGeneral("g1" as GeneralId))?.name).toBe("曹操");
  });
  it("getGenerals returns [] on empty index", async () => {
    expect(await entityStore.getGenerals()).toEqual([]);
  });
  it("putGeneral updates index", async () => {
    await entityStore.putGeneral("g1" as GeneralId, G("g1", "X"));
    await entityStore.putGeneral("g2" as GeneralId, G("g2", "Y"));
    const all = await entityStore.getGenerals();
    expect(all.map((g) => g.id).sort()).toEqual(["g1", "g2"]);
  });
  it("putSkill maintains skills:by-general", async () => {
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", ["g1"]));
    expect((await entityStore.getSkillsByGeneral("g1" as GeneralId)).map((s) => s.id)).toEqual(["s1"]);
  });
  it("putSkill removes old reverse entries on shrink", async () => {
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", ["g1", "g2"]));
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", ["g1"]));
    expect((await entityStore.getSkillsByGeneral("g1" as GeneralId)).length).toBe(1);
    expect((await entityStore.getSkillsByGeneral("g2" as GeneralId)).length).toBe(0);
  });
  it("getSkills uses skills:index", async () => {
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", []));
    await entityStore.putSkill("s2" as SkillId, S("s2", "B", []));
    const all = await entityStore.getSkills();
    expect(all.map((s) => s.id).sort()).toEqual(["s1", "s2"]);
  });
  it("putFaq + getFaqs + deleteFaq", async () => {
    await entityStore.putFaq("f1" as FAQId, F("f1", "q1", []));
    await entityStore.putFaq("f2" as FAQId, F("f2", "q2", []));
    expect((await entityStore.getFaqs()).map((f) => f.id).sort()).toEqual(["f1", "f2"]);
    await entityStore.deleteFaq("f1" as FAQId);
    expect((await entityStore.getFaqs()).map((f) => f.id)).toEqual(["f2"]);
  });
});

describe("entityStore fallback to JSON when Redis env missing", () => {
  it("getGenerals reads bundled JSON", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    __resetForTests();
    const all = await entityStore.getGenerals();
    expect(all.length).toBeGreaterThan(0);
  });
});

describe("entityStore fallback when Redis throws", () => {
  it("getGenerals falls back to JSON on mget failure", async () => {
    throwOnMget = true;
    mem.set("generals:index", JSON.stringify(["g1"]));
    const all = await entityStore.getGenerals();
    expect(all.length).toBeGreaterThan(0); // returned from JSON, not Redis
  });
  it("getGeneral falls back to JSON on get failure", async () => {
    throwOnGet = true;
    const g = await entityStore.getGeneral("not-real" as GeneralId);
    expect(g).toBeNull(); // gracefully returns null from JSON path (won't find this id)
  });
});

describe("entityStore writes never fall back", () => {
  it("putGeneral throws when Redis unavailable", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    __resetForTests();
    await expect(entityStore.putGeneral("g1" as GeneralId, G("g1", "X"))).rejects.toThrow();
  });
});
