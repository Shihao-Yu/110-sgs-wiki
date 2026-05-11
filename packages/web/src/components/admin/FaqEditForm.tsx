"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FAQ } from "@sgs/data";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import MultiSelect from "./MultiSelect";
import InlineConfirm from "./InlineConfirm";
import { toast } from "./Toaster";

const CATEGORIES = [
  { value: "rule", label: "通用" },
  { value: "general", label: "武将" },
];

export default function FaqEditForm({
  faq,
  allGenerals,
  onClose,
}: {
  faq: FAQ;
  allGenerals: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const router = useRouter();
  const initialRelated = (faq.relatedGeneralIds as unknown as string[]) ?? [];
  const initialCategory = faq.category === "rule" || faq.category === "general" ? faq.category : "general";
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [category, setCategory] = useState<"general" | "rule">(initialCategory);
  const [related, setRelated] = useState<string[]>(initialRelated);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const dirty =
    question !== faq.question ||
    answer !== faq.answer ||
    category !== initialCategory ||
    JSON.stringify(related) !== JSON.stringify(initialRelated);

  function fieldClass(path: string) {
    return fieldErrors[path] ? "input-base input-error" : "input-base";
  }

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await adminFetch(`/api/admin/faqs/${faq.id}`, {
        method: "PATCH",
        body: JSON.stringify({ question, answer, category, relatedGeneralIds: related }),
      });
      toast("FAQ 已保存", "success");
      router.refresh();
      onClose();
    } catch (e) {
      const err = e as AdminFetchError;
      if (err.fieldErrors) {
        const m: Record<string, string> = {};
        for (const fe of err.fieldErrors) m[fe.path] = fe.message;
        setFieldErrors(m);
      } else {
        setError(err.message ?? "保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    try {
      await adminFetch(`/api/admin/faqs/${faq.id}`, { method: "DELETE" });
      toast("FAQ 已删除", "success");
      router.refresh();
      onClose();
    } catch (e) {
      const err = e as AdminFetchError;
      toast(err.message ?? "删除失败", "error");
    }
  }

  function handleCancel() {
    if (dirty && !confirm("有未保存的修改，确定放弃？")) return;
    onClose();
  }

  return (
    <div className="space-y-3 rounded-md border border-vermillion/30 bg-paper-mist/80 p-4 text-sm dark:bg-paper-deep/80">
      <h3 className="font-semibold">编辑 FAQ</h3>
      <label className="block">
        <span className="mb-1 block text-xs">问题</span>
        <textarea rows={2} className={fieldClass("question")} value={question} onChange={(e) => setQuestion(e.target.value)} />
        {fieldErrors.question && <span className="text-xs text-red-500">{fieldErrors.question}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs">答案</span>
        <textarea rows={4} className={fieldClass("answer")} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        {fieldErrors.answer && <span className="text-xs text-red-500">{fieldErrors.answer}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs">类别</span>
        <select className={fieldClass("category")} value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs">关联武将</span>
        <MultiSelect
          ariaLabel="关联武将"
          options={allGenerals.map((g) => ({ value: g.id, label: g.name }))}
          value={related}
          onChange={setRelated}
        />
      </label>

      {error && <p role="alert" className="text-red-500">{error}</p>}
      <div className="flex items-center justify-between pt-2">
        <InlineConfirm
          destructive
          ariaLabel="删除该 FAQ"
          message="删除该 FAQ?"
          trigger={
            <span className="btn-danger inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M9 6v12m6-12v12M6 6l1 14h10l1-14" />
              </svg>
              删除
            </span>
          }
          onConfirm={del}
        />
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={handleCancel}>取消</button>
          <button type="button" disabled={saving} className="btn-primary" onClick={save}>
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
