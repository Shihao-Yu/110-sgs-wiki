"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { General } from "@sgs/data";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import MultiSelect from "./MultiSelect";
import TagInput from "./TagInput";
import { toast } from "./Toaster";

const FACTIONS = [
  { value: "WEI", label: "魏" },
  { value: "SHU", label: "蜀" },
  { value: "WU", label: "吴" },
  { value: "QUN", label: "群" },
  { value: "JIN", label: "晋" },
];

export default function GeneralEditForm({
  general,
  allGenerals,
  allSkills,
  onClose,
}: {
  general: General;
  allGenerals: Array<{ id: string; name: string }>;
  allSkills: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const router = useRouter();
  const initial = general;
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
    <div className="space-y-3 rounded-md border border-vermillion/30 bg-paper-mist/80 p-4 text-sm dark:bg-paper-deep/80">
      <h3 className="font-semibold">编辑武将基础字段</h3>
      <Field label="名称" error={fieldErrors.name}>
        <input className={fieldClass("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="称号" error={fieldErrors.title}>
        <input className={fieldClass("title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="势力" error={fieldErrors.faction}>
        <select className={fieldClass("faction")} value={form.faction} onChange={(e) => setForm({ ...form, faction: e.target.value as General["faction"] })}>
          {FACTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <Field label="副势力（可选）" error={fieldErrors.subfaction}>
        <select className={fieldClass("subfaction")} value={form.subfaction ?? ""} onChange={(e) => setForm({ ...form, subfaction: (e.target.value || undefined) as General["subfaction"] })}>
          <option value="">（无）</option>
          {FACTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="HP" error={fieldErrors.hp}>
          <input type="number" min={1} max={12} className={fieldClass("hp")} value={form.hp} onChange={(e) => setForm({ ...form, hp: parseInt(e.target.value, 10) })} />
        </Field>
        <Field label="HP上限" error={fieldErrors.maxHp}>
          <input type="number" min={1} max={12} className={fieldClass("maxHp")} value={form.maxHp} onChange={(e) => setForm({ ...form, maxHp: parseInt(e.target.value, 10) })} />
        </Field>
      </div>
      <Field label="性别" error={fieldErrors.gender}>
        <select className={fieldClass("gender")} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as General["gender"] })}>
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
      </Field>
      <Field label="技能" error={fieldErrors.skills}>
        <MultiSelect
          ariaLabel="选择技能"
          options={allSkills.map((s) => ({ value: s.id, label: s.name }))}
          value={form.skills as unknown as string[]}
          onChange={(next) => setForm({ ...form, skills: next as unknown as General["skills"] })}
        />
      </Field>
      <Field label="image (URL)" error={fieldErrors.image}>
        <input className={fieldClass("image")} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
      </Field>
      <Field label="包/系列" error={fieldErrors.pack}>
        <input className={fieldClass("pack")} value={form.pack} onChange={(e) => setForm({ ...form, pack: e.target.value })} />
      </Field>
      <Field label="设计师">
        <input className="input-base" value={form.designer ?? ""} onChange={(e) => setForm({ ...form, designer: e.target.value || undefined })} />
      </Field>
      <Field label="珠联璧合搭档（武将ID）">
        <MultiSelect
          ariaLabel="选择珠联璧合搭档"
          options={allGenerals.filter((g) => g.id !== (general.id as unknown as string)).map((g) => ({ value: g.id, label: g.name }))}
          value={(form.perfectMatchPartners as unknown as string[]) ?? []}
          onChange={(next) => setForm({ ...form, perfectMatchPartners: next as unknown as General["perfectMatchPartners"] })}
        />
      </Field>
      <Field label="pairedNames">
        <TagInput ariaLabel="pairedNames" value={form.pairedNames ?? []} onChange={(next) => setForm({ ...form, pairedNames: next })} />
      </Field>
      <div className="flex items-center gap-3 pt-1">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!form.paired} onChange={(e) => setForm({ ...form, paired: e.target.checked })} />
          双将
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!form.isEmperor} onChange={(e) => setForm({ ...form, isEmperor: e.target.checked })} />
          主公
        </label>
      </div>

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

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
