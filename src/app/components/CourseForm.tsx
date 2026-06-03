"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Pencil, Plus, Check, X } from "lucide-react";
import Breadcrumb from "./Breadcrumb";

interface CourseFormProps {
  courseNum: string;
  storageKey: string;
  editorHref: string;
  canEdit?: boolean;
}

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface CourseMeta {
  courseName: string;
  title: string;
  date: string;
  customFields: CustomField[];
}

const empty = (): CourseMeta => ({
  courseName: "",
  title: "",
  date: "",
  customFields: [],
});

const makeField = (): CustomField => ({
  id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  label: "",
  value: "",
});

function metaEquals(a: CourseMeta, b: CourseMeta): boolean {
  if (a.courseName !== b.courseName || a.title !== b.title || a.date !== b.date) return false;
  if (a.customFields.length !== b.customFields.length) return false;
  return a.customFields.every((f, i) => {
    const o = b.customFields[i];
    return o && o.id === f.id && o.label === f.label && o.value === f.value;
  });
}

export default function CourseForm({ courseNum, storageKey, editorHref, canEdit = true }: CourseFormProps) {
  const [meta, setMeta] = useState<CourseMeta>(empty);
  const [saved, setSaved] = useState<CourseMeta>(empty);
  const [editing, setEditing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CourseMeta> & { lastSavedAt?: number };
        const next: CourseMeta = {
          courseName: parsed.courseName ?? "",
          title: parsed.title ?? "",
          date: parsed.date ?? "",
          customFields: Array.isArray(parsed.customFields) ? parsed.customFields : [],
        };
        setMeta(next);
        setSaved(next);
        if (typeof parsed.lastSavedAt === "number") setLastSavedAt(parsed.lastSavedAt);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const isDirty = !metaEquals(meta, saved);

  const handleSave = () => {
    const now = Date.now();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ ...meta, lastSavedAt: now }));
    } catch {
      // ignore
    }
    setSaved(meta);
    setLastSavedAt(now);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setMeta(saved);
    setEditing(false);
  };

  const addCustomField = () => {
    setMeta((m) => ({ ...m, customFields: [...m.customFields, makeField()] }));
  };

  const updateCustomField = (id: string, patch: Partial<CustomField>) => {
    setMeta((m) => ({
      ...m,
      customFields: m.customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  const removeCustomField = (id: string) => {
    setMeta((m) => ({ ...m, customFields: m.customFields.filter((f) => f.id !== id) }));
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        {!canEdit && (
          <div
            role="status"
            className="bg-amber-100 text-amber-900 border border-amber-300 rounded-lg px-4 py-2 mb-4 text-sm font-semibold"
          >
            View only — contact your administrator to edit.
          </div>
        )}
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Academy", href: "/academy" },
            { label: "Training", href: "/academy/training" },
            { label: `Course ${courseNum}` },
          ]}
        />
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
            <span>COURSE {courseNum}</span>
          </div>
          <Link
            href={editorHref}
            title="Open the rich-text editor for this course"
            className="ml-auto inline-flex items-center gap-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 px-4 py-2 rounded-xl font-bold transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-3xl mx-auto">
          <div className="space-y-5">
            <FormRow label="Course Name">
              <FormInput
                value={meta.courseName}
                onChange={(v) => setMeta((m) => ({ ...m, courseName: v }))}
                disabled={!editing}
                readOnly={!canEdit}
              />
            </FormRow>
            <FormRow label="Title">
              <FormInput
                value={meta.title}
                onChange={(v) => setMeta((m) => ({ ...m, title: v }))}
                disabled={!editing}
                readOnly={!canEdit}
              />
            </FormRow>
            <FormRow label="Date">
              <FormInput
                value={meta.date}
                onChange={(v) => setMeta((m) => ({ ...m, date: v }))}
                disabled={!editing}
                type="date"
                readOnly={!canEdit}
              />
            </FormRow>

            {meta.customFields.map((field) => (
              <div key={field.id} className="grid grid-cols-[140px_1fr_auto] gap-4 items-center">
                {editing ? (
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                    readOnly={!canEdit}
                    placeholder="Field name"
                    className="px-3 py-2 rounded-lg border border-violet-200 bg-violet-50 font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                ) : (
                  <label className="font-bold text-slate-900">{field.label || "(no name)"}:</label>
                )}
                <FormInput
                  value={field.value}
                  onChange={(v) => updateCustomField(field.id, { value: v })}
                  disabled={!editing}
                  readOnly={!canEdit}
                />
                {editing ? (
                  <button
                    type="button"
                    onClick={() => removeCustomField(field.id)}
                    disabled={!canEdit}
                    title="Remove this field"
                    aria-label="Remove field"
                    className={`w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <span aria-hidden />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-7">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={addCustomField}
                  disabled={!canEdit}
                  className={`inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-bold transition-colors ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
                >
                  <Plus className="w-4 h-4" />
                  Add Field
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={!canEdit}
                  className={`inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-colors ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={!canEdit}
                className={`inline-flex items-center gap-2 bg-violet-100 hover:bg-violet-200 text-violet-700 px-4 py-2.5 rounded-xl font-bold transition-colors ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            )}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold ${
                isDirty
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <Check className="w-4 h-4" />
              {isDirty ? "Unsaved" : "Saved"}
            </div>
            {lastSavedAt && !isDirty && (
              <span className="text-xs text-slate-500">
                · last saved {new Date(lastSavedAt).toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex justify-center mt-10">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canEdit || !editing || !isDirty}
              aria-label="Save changes"
              title="Save"
              className={`w-14 h-14 rounded-full bg-violet-100 hover:bg-violet-200 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed flex items-center justify-center text-violet-700 transition-all shadow hover:shadow-md ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
            >
              <Check className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
      <label className="font-bold text-slate-900">{label}:</label>
      {children}
    </div>
  );
}

function FormInput({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      placeholder="Enter value"
      className="px-3 py-2 rounded-lg border border-slate-200 bg-violet-50/50 disabled:bg-slate-50 disabled:text-slate-700 disabled:cursor-default hover:border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors"
    />
  );
}
