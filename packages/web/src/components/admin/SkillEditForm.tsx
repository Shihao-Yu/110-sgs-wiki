"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Skill } from "@sgs/data";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import { toast } from "./Toaster";

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

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await adminFetch(`/api/admin/skills/${skill.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast("已保存", "success");
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
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs text-ink-mute dark:text-ivory-soft">技能</p>
        <p className="font-display text-base">{skill.name}</p>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">描述</span>
        <textarea
          rows={8}
          className={
            (fieldErrors.description ? "input-base input-error" : "input-base") + " leading-relaxed"
          }
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {fieldErrors.description && (
          <span className="mt-1 block text-xs text-red-500">{fieldErrors.description}</span>
        )}
      </label>

      {error && <p role="alert" className="text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={handleCancel}>取消</button>
        <button type="button" disabled={saving || !dirty} className="btn-primary" onClick={save}>
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
