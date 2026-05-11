"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { General } from "@sgs/data";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import { toast } from "./Toaster";

export default function GeneralEditForm({
  general,
  onClose,
}: {
  general: General;
  onClose: () => void;
}) {
  const router = useRouter();
  const initial = general;
  // Form state mirrors full General so we can PUT the whole object with
  // unchanged fields preserved. UI only exposes hp / maxHp / gender.
  const [form, setForm] = useState<General>(general);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
      await adminFetch(`/api/admin/generals/${general.id}`, {
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="体力" error={fieldErrors.hp}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            className={fieldClass("hp")}
            value={form.hp}
            onChange={(e) => setForm({ ...form, hp: parseInt(e.target.value, 10) })}
          />
        </Field>
        <Field label="体力上限" error={fieldErrors.maxHp}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            className={fieldClass("maxHp")}
            value={form.maxHp}
            onChange={(e) => setForm({ ...form, maxHp: parseInt(e.target.value, 10) })}
          />
        </Field>
      </div>
      <Field label="性别" error={fieldErrors.gender}>
        <select
          className={fieldClass("gender")}
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value as General["gender"] })}
        >
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
      </Field>

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

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
