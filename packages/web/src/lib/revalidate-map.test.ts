import { describe, expect, it } from "vitest";
import { pathsToRevalidate, type Mutation } from "./revalidate-map.js";

describe("pathsToRevalidate", () => {
  it("general edit → /generals + /generals/{id}", () => {
    const m: Mutation = { type: "general", id: "g1" };
    expect(pathsToRevalidate(m).sort()).toEqual(["/generals", "/generals/g1"]);
  });

  it("skill edit → /generals (list) + each general it appears on", () => {
    const m: Mutation = {
      type: "skill",
      id: "s1",
      newValue: { generalIds: ["g1", "g2"] } as unknown as import("@sgs/data").Skill,
      oldValue: { generalIds: ["g1", "g3"] } as unknown as import("@sgs/data").Skill,
    };
    const got = pathsToRevalidate(m).sort();
    expect(got).toEqual(["/generals", "/generals/g1", "/generals/g2", "/generals/g3"]);
  });

  it("faq create → /faq + each related general", () => {
    const m: Mutation = {
      type: "faq",
      id: "f1",
      newValue: { relatedGeneralIds: ["g1", "g2"] } as unknown as import("@sgs/data").FAQ,
    };
    expect(pathsToRevalidate(m).sort()).toEqual(["/faq", "/generals/g1", "/generals/g2"]);
  });

  it("faq update with relation change → /faq + union of old & new related generals", () => {
    const m: Mutation = {
      type: "faq",
      id: "f1",
      oldValue: { relatedGeneralIds: ["g1"] } as unknown as import("@sgs/data").FAQ,
      newValue: { relatedGeneralIds: ["g2"] } as unknown as import("@sgs/data").FAQ,
    };
    expect(pathsToRevalidate(m).sort()).toEqual(["/faq", "/generals/g1", "/generals/g2"]);
  });

  it("faq delete → /faq + all old related generals", () => {
    const m: Mutation = {
      type: "faq",
      id: "f1",
      oldValue: { relatedGeneralIds: ["g1", "g2"] } as unknown as import("@sgs/data").FAQ,
    };
    expect(pathsToRevalidate(m).sort()).toEqual(["/faq", "/generals/g1", "/generals/g2"]);
  });

  it("dedupes paths", () => {
    const m: Mutation = {
      type: "faq",
      id: "f1",
      oldValue: { relatedGeneralIds: ["g1", "g1"] } as unknown as import("@sgs/data").FAQ,
      newValue: { relatedGeneralIds: ["g1"] } as unknown as import("@sgs/data").FAQ,
    };
    expect(pathsToRevalidate(m)).toEqual(["/faq", "/generals/g1"]);
  });
});
