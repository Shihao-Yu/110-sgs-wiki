"use client";

import type { Skill } from "@sgs/data";
import EditAffordance from "@/components/admin/EditAffordance";
import SkillEditForm from "@/components/admin/SkillEditForm";

const PencilSvg = (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

export default function AdminSkillEdit({ skill }: { skill: Skill }) {
  return (
    <EditAffordance
      ariaLabel="编辑技能"
      trigger={PencilSvg}
      renderForm={(close) => <SkillEditForm skill={skill} onClose={close} />}
    />
  );
}
