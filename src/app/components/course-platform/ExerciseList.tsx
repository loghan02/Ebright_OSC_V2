"use client";

import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";

interface ExerciseAttachment {
  name: string;
  type: string;
  dataUrl: string;
}

interface Exercise {
  id: string;
  instructions: string;
  attachment?: ExerciseAttachment;
}

interface Props {
  courseSlug: string;
}

export default function ExerciseList({ courseSlug }: Props) {
  const storageKey = `academy.training.${courseSlug}.exercises`;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setExercises(parsed as Exercise[]);
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        try {
          setExercises(e.newValue ? (JSON.parse(e.newValue) as Exercise[]) : []);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  if (!loaded) {
    return <div className="text-sm text-slate-400 italic">Loading…</div>;
  }

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic">
        No exercises published yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {exercises.map((ex, i) => (
        <li
          key={ex.id}
          className="border border-slate-200 rounded-xl p-4 bg-slate-50"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                {ex.instructions || (
                  <span className="italic text-slate-400">(no instructions)</span>
                )}
              </p>
              {ex.attachment && (
                <a
                  href={ex.attachment.dataUrl}
                  download={ex.attachment.name}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <Paperclip className="w-4 h-4" />
                  {ex.attachment.name}
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
