"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Skill } from "@sgs/data";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import TagInput from "./TagInput";
import { toast } from "./Toaster";

const SKILL_TYPES = [
  { value: "active", label: "主动" },
  { value: "passive", label: "被动" },
  { value: "lock", label: "锁定" },
  { value: "limited", label: "限定" },
  { value: "awakening", label: "觉醒" },
  { value: "mission", label: "使命" },
];

export default function SkillEditForm({
  skill,
  onClose,
}: {
  skill: Skill;
  onClose: () => void;
}) {
  const router = useRouter();
  const initial = skill;
  const [form, setForm] = useState<Skill>(skill);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function fieldClass(path: string) {
    return fieldErrors[path] ? "input-base input-error" : "input-base";
  }

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await adminFetch(`/api/admin/skills/${skill.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast("已保存。如需让首页搜索立即对齐，点顶栏的『同步搜索』", "success");
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

  function handleCancel() {
    if (dirty && !confirm("有未保存的修改，确定放弃？")) return;
    onClose();
  }

  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">名称</span>
        <input className={fieldClass("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        {fieldErrors.name && <span className="text-xs text-red-500">{fieldErrors.name}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">类型</span>
        <select className={fieldClass("type")} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Skill["type"] })}>
          {SKILL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {fieldErrors.type && <span className="text-xs text-red-500">{fieldErrors.type}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">描述</span>
        <textarea
          rows={6}
          className={fieldClass("description") + " leading-relaxed"}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {fieldErrors.description && <span className="text-xs text-red-500">{fieldErrors.description}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">时机 (timing)</span>
        <TagInput ariaLabel="时机" value={form.timing ?? []} onChange={(next) => setForm({ ...form, timing: next })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">标签</span>
        <TagInput ariaLabel="标签" value={form.tags ?? []} onChange={(next) => setForm({ ...form, tags: next })} />
      </label>

      {error && <p role="alert" className="text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={handleCancel}>取消</button>
        <button type="button" disabled={saving} className="btn-primary" onClick={save}>
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
