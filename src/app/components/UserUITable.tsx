"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, Paperclip, FileText, Download, X } from "lucide-react";
import Breadcrumb from "./Breadcrumb";

const STORAGE_KEY = "academy.ebright-class-syllabus.user.user-ui.rows";

const STATUS_OPTIONS = ["COMPLETE", "IN PROGRESS", "INCOMPLETE"];

interface NoteDoc {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

interface Row {
  id: string;
  month: string;
  name: string;
  notes: string;
  notesDoc?: NoteDoc;
  hyperlink: string;
  status: string;
}

const newId = () => `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const makeRow = (): Row => ({
  id: newId(),
  month: "",
  name: "",
  notes: "",
  hyperlink: "",
  status: STATUS_OPTIONS[0],
});

const STATUS_STYLES: Record<string, string> = {
  COMPLETE: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  "IN PROGRESS": "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  INCOMPLETE: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
};

interface UserUITableProps {
  canEdit?: boolean;
}

export default function UserUITable({ canEdit = true }: UserUITableProps = {}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRows(parsed);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // ignore
    }
  }, [rows, loaded]);

  const addRow = () => setRows((r) => [...r, makeRow()]);

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const deleteRow = (id: string) => {
    setRows((r) => r.filter((row) => row.id !== id));
    setConfirmDelete(null);
  };

  const handleNoteUpload = (rowId: string, file?: File) => {
    if (!file) return;
    const MAX_BYTES = 2 * 1024 * 1024; // 2 MB per attachment
    if (file.size > MAX_BYTES) {
      alert("Attachment is too large (max 2 MB per note).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateRow(rowId, {
        notesDoc: {
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          dataUrl: reader.result as string,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-full bg-slate-50">
      {!canEdit && (
        <div
          role="status"
          className="bg-amber-100 text-amber-900 border border-amber-300 rounded-lg px-4 py-2 mb-4 text-sm font-semibold"
        >
          View only — contact your administrator to edit.
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Academy", href: "/academy" },
            { label: "Ebright Class Syllabus", href: "/academy/ebright-class-syllabus" },
            { label: "User", href: "/academy/ebright-class-syllabus/user" },
            { label: "User UI" },
          ]}
        />
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide">
            <span className="text-xl" aria-hidden="true">🖥️</span>
            <span>USER UI</span>
          </div>
          <button
            type="button"
            onClick={addRow}
            disabled={!canEdit}
            className={`ml-auto inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl font-bold transition-colors ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-amber-700 text-white">
                  <th className="text-left px-4 py-3 font-bold tracking-wide w-14 border-r border-white/30">NO</th>
                  <th className="text-left px-4 py-3 font-bold tracking-wide w-36 border-r border-white/30">MONTH</th>
                  <th className="text-left px-4 py-3 font-bold tracking-wide w-44 border-r border-white/30">NAME</th>
                  <th className="text-left px-4 py-3 font-bold tracking-wide border-r border-white/30">NOTES</th>
                  <th className="text-left px-4 py-3 font-bold tracking-wide w-56 border-r border-white/30">HYPERLINK</th>
                  <th className="text-left px-4 py-3 font-bold tracking-wide w-40 border-r border-white/30">STATUS</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {!loaded || rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm italic text-slate-400">
                      No rows yet. Click <strong>+ Add Row</strong> to start.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                      <td className="px-4 py-2 text-center font-bold text-amber-800 border-r border-slate-100 tabular-nums">
                        {i + 1}
                      </td>
                      <td className="px-2 py-1 border-r border-slate-100">
                        <input
                          type="text"
                          value={row.month}
                          onChange={(e) => updateRow(row.id, { month: e.target.value })}
                          readOnly={!canEdit}
                          placeholder="e.g. January"
                          className="w-full px-2 py-1.5 rounded-md bg-transparent text-slate-900 border border-transparent hover:border-slate-200 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </td>
                      <td className="px-2 py-1 border-r border-slate-100">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateRow(row.id, { name: e.target.value })}
                          readOnly={!canEdit}
                          placeholder="Name"
                          className="w-full px-2 py-1.5 rounded-md bg-transparent text-slate-900 border border-transparent hover:border-slate-200 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </td>
                      <td className="px-2 py-1 border-r border-slate-100">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={row.notes}
                              onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                              readOnly={!canEdit}
                              placeholder="Notes"
                              className="flex-1 min-w-0 px-2 py-1.5 rounded-md bg-transparent text-slate-900 border border-transparent hover:border-slate-200 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <label
                              title="Attach a document"
                              className={`w-7 h-7 rounded-md text-slate-500 hover:text-amber-700 hover:bg-amber-50 flex items-center justify-center cursor-pointer shrink-0 ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
                            >
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                className="hidden"
                                disabled={!canEdit}
                                onChange={(e) => {
                                  handleNoteUpload(row.id, e.target.files?.[0]);
                                  e.target.value = "";
                                }}
                              />
                              <Paperclip className="w-4 h-4" />
                            </label>
                          </div>
                          {row.notesDoc && (
                            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1 text-xs">
                              <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="text-amber-900 font-medium truncate" title={row.notesDoc.name}>
                                {row.notesDoc.name}
                              </span>
                              <span className="text-amber-700 tabular-nums shrink-0">
                                {(row.notesDoc.size / 1024).toFixed(0)} KB
                              </span>
                              <a
                                href={row.notesDoc.dataUrl}
                                download={row.notesDoc.name}
                                title="Download"
                                className="w-5 h-5 rounded text-amber-700 hover:bg-amber-100 flex items-center justify-center shrink-0"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => updateRow(row.id, { notesDoc: undefined })}
                                disabled={!canEdit}
                                title="Remove attachment"
                                className={`w-5 h-5 rounded text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0 ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1 border-r border-slate-100">
                        <div className="flex items-center gap-1">
                          <input
                            type="url"
                            value={row.hyperlink}
                            onChange={(e) => updateRow(row.id, { hyperlink: e.target.value })}
                            readOnly={!canEdit}
                            placeholder="https://…"
                            className="flex-1 min-w-0 px-2 py-1.5 rounded-md bg-transparent text-slate-900 border border-transparent hover:border-slate-200 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                          {row.hyperlink && (
                            <a
                              href={row.hyperlink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open link"
                              className="w-7 h-7 rounded-md text-amber-700 hover:bg-amber-50 flex items-center justify-center shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                              STATUS_STYLES[row.status] ?? "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {row.status || "—"}
                          </span>
                          <select
                            value={row.status}
                            onChange={(e) => updateRow(row.id, { status: e.target.value })}
                            disabled={!canEdit}
                            className={`text-xs bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-600 rounded px-1 py-1 focus:outline-none ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
                            aria-label="Status"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(row.id)}
                          disabled={!canEdit}
                          aria-label="Delete row"
                          title="Delete row"
                          className={`w-8 h-8 rounded-md text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 flex items-center justify-center px-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete this row?</h3>
            <p className="text-sm text-slate-600 mb-5">
              This will permanently remove the row. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteRow(confirmDelete)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
