import type { General, Skill, FAQ } from "@sgs/data";

export type Mutation =
  | { type: "general"; id: string; oldValue?: General; newValue?: General }
  | { type: "skill"; id: string; oldValue?: Skill; newValue?: Skill }
  | { type: "faq"; id: string; oldValue?: FAQ; newValue?: FAQ }
  | { type: "rating"; id: string };

export function pathsToRevalidate(m: Mutation): string[] {
  const out = new Set<string>();
  switch (m.type) {
    case "general": {
      out.add("/generals");
      out.add(`/generals/${m.id}`);
      break;
    }
    case "skill": {
      out.add("/generals");
      const oldIds = m.oldValue?.generalIds ?? [];
      const newIds = m.newValue?.generalIds ?? [];
      for (const gid of [...oldIds, ...newIds]) out.add(`/generals/${gid}`);
      break;
    }
    case "faq": {
      out.add("/faq");
      const oldRel = m.oldValue?.relatedGeneralIds ?? [];
      const newRel = m.newValue?.relatedGeneralIds ?? [];
      for (const gid of [...oldRel, ...newRel]) out.add(`/generals/${gid}`);
      break;
    }
    case "rating": {
      out.add("/generals");
      out.add(`/generals/${m.id}`);
      break;
    }
  }
  return Array.from(out);
}
