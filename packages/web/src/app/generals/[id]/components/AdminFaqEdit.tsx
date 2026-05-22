"use client";

import type { FAQ } from "@sgs/data";
import { useAdmin } from "@/components/admin/AdminContext";
import EditAffordance from "@/components/admin/EditAffordance";
import FaqEditForm from "@/components/admin/FaqEditForm";

export default function AdminFaqEdit({
  faq,
  allGenerals,
}: {
  faq: FAQ;
  allGenerals: Array<{ id: string; name: string }>;
}) {
  const { authed } = useAdmin();
  if (!authed) return null;
  return (
    <div className="border-t border-slate-200/40 px-5 py-2 dark:border-slate-700/40">
      <EditAffordance
        ariaLabel="编辑该 FAQ"
        trigger={
          <span className="inline-flex items-center gap-1 text-xs text-vermillion">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            编辑 / 删除
          </span>
        }
        renderForm={(close) => (
          <FaqEditForm faq={faq} allGenerals={allGenerals} onClose={close} />
        )}
      />
    </div>
  );
}
