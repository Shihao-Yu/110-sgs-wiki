"use client";

import EditAffordance from "@/components/admin/EditAffordance";
import FaqNewForm from "@/components/admin/FaqNewForm";

export default function AdminFaqAdd({
  generalId,
  allGenerals,
}: {
  generalId: string;
  allGenerals: Array<{ id: string; name: string }>;
}) {
  return (
    <EditAffordance
      ariaLabel={`为本武将添加 FAQ`}
      trigger={
        <span className="inline-flex items-center gap-1 rounded border border-vermillion/40 px-2 py-1 text-xs text-vermillion">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          为本武将添加 FAQ
        </span>
      }
      renderForm={(close) => (
        <FaqNewForm preselectedGeneralId={generalId} allGenerals={allGenerals} onClose={close} />
      )}
    />
  );
}
