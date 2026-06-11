"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, ExternalLink, X } from "lucide-react";

interface Props {
  courseSlug: string;
  canCoach: boolean;
}

export default function CourseVideoLink({ courseSlug, canCoach }: Props) {
  const storageKey = `academy.training.${courseSlug}.videoUrl`;
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setUrl(raw);
        setDraft(raw);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [storageKey]);

  const save = () => {
    const next = draft.trim();
    try {
      if (next) {
        localStorage.setItem(storageKey, next);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // ignore
    }
    setUrl(next);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(url);
    setEditing(false);
  };

  if (!loaded) {
    return <div className="text-sm text-slate-400 italic">Loading…</div>;
  }

  if (canCoach && editing) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            <Check className="w-4 h-4" /> Save
          </button>
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold text-sm"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!url) {
    return canCoach ? (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 italic">No video URL added yet.</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 bg-violet-100 hover:bg-violet-200 text-violet-800 px-3 py-1.5 rounded-lg font-semibold text-sm"
        >
          <Pencil className="w-4 h-4" /> Add URL
        </button>
      </div>
    ) : (
      <p className="text-sm text-slate-500 italic">No video URL has been uploaded yet by your coach.</p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline text-sm break-all"
      >
        <ExternalLink className="w-4 h-4 shrink-0" />
        <span>{url}</span>
      </a>
      {canCoach && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 bg-violet-100 hover:bg-violet-200 text-violet-800 px-3 py-1.5 rounded-lg font-semibold text-sm shrink-0"
        >
          <Pencil className="w-4 h-4" /> Edit
        </button>
      )}
    </div>
  );
}
