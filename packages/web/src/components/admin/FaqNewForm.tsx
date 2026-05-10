"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import MultiSelect from "./MultiSelect";
import { toast } from "./Toaster";

const CATEGORIES = [
  { value: "general", label: "通用" },
  { value: "rule", label: "规则" },
];

export default function FaqNewForm({
  preselectedGeneralId,
  allGenerals,
  onClose,
}: {
  preselectedGeneralId?: string;
  allGenerals: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<"general" | "rule">("general");
  const [related, setRelated] = useState<string[]>(preselectedGeneralId ? [preselectedGeneralId] : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const dirty = question.length > 0 || answer.length > 0;

  function fieldClass(path: string) {
    return fieldErrors[path] ? "input-base input-error" : "input-base";
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await adminFetch(`/api/admin/faqs`, {
        method: "POST",
        body: JSON.stringify({ question, answer, category, relatedGeneralIds: related }),
      });
      toast("FAQ 已新建", "success");
      router.refresh();
      onClose();
    } catch (e) {
      const err = e as AdminFetchError;
      if (err.fieldErrors) {
        const m: Record<string, string> = {};
        for (const fe of err.fieldErrors) m[fe.path] = fe.message;
        setFieldErrors(m);
      } else {
        setError(err.message ?? "新建失败");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (dirty && !confirm("有未保存的修改，确定放弃？")) return;
    onClose();
  }

  return (
    <div className="space-y-3 rounded-md border border-vermillion/30 bg-paper-mist/80 p-4 text-sm dark:bg-paper-deep/80">
      <h3 className="font-semibold">新建 FAQ</h3>
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
        {fieldErrors.category && <span className="text-xs text-red-500">{fieldErrors.category}</span>}
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
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={handleCancel}>取消</button>
        <button type="button" disabled={saving} className="btn-primary" onClick={submit}>
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
