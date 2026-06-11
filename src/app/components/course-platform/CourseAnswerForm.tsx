"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowLeft, Paperclip, ClipboardCheck } from "lucide-react";

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

interface AnswerEntry {
  text: string;
  answeredAt: number;
}

type Answers = Record<string, AnswerEntry>;

interface MarkEntry {
  score: string;
  comment: string;
  markedAt: number | null;
}

type Marks = Record<string, MarkEntry>;

interface Props {
  courseSlug: string;
  courseNum: string;
}

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function CourseAnswerForm({ courseSlug, courseNum }: Props) {
  const exercisesKey = `academy.training.${courseSlug}.exercises`;
  const answersKey = `academy.training.${courseSlug}.answers`;
  const marksKey = `academy.training.${courseSlug}.marks`;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [marks, setMarks] = useState<Marks>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let parsedExercises: Exercise[] = [];
    try {
      const raw = localStorage.getItem(exercisesKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) parsedExercises = parsed as Exercise[];
      }
    } catch {
      // ignore
    }
    setExercises(parsedExercises);

    let parsedAnswers: Answers = {};
    try {
      const raw = localStorage.getItem(answersKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") parsedAnswers = parsed as Answers;
      }
    } catch {
      // ignore
    }

    const initial: Record<string, string> = {};
    for (const ex of parsedExercises) {
      initial[ex.id] = parsedAnswers[ex.id]?.text ?? "";
    }
    setDrafts(initial);

    let parsedMarks: Marks = {};
    try {
      const raw = localStorage.getItem(marksKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") parsedMarks = parsed as Marks;
      }
    } catch {
      // ignore
    }
    setMarks(parsedMarks);

    setLoaded(true);
  }, [exercisesKey, answersKey, marksKey]);

  const update = (id: string, text: string) => {
    setDrafts((prev) => ({ ...prev, [id]: text }));
    setSavedAt(null);
  };

  const submit = () => {
    setError(null);
    const now = Date.now();
    const next: Answers = {};
    for (const ex of exercises) {
      const text = (drafts[ex.id] ?? "").trim();
      if (text) {
        next[ex.id] = { text, answeredAt: now };
      }
    }
    try {
      localStorage.setItem(answersKey, JSON.stringify(next));
      setSavedAt(now);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(`Could not save answers: ${msg}`);
    }
  };

  if (!loaded) {
    return <p className="text-sm text-slate-400 italic">Loading…</p>;
  }

  return (
    <div>
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="inline-flex items-center gap-3 text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
          <span>COURSE {courseNum} — Your Answers</span>
        </h1>
        <Link
          href={`/academy/training/${courseSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to course
        </Link>
      </header>

      {exercises.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
          <p className="text-sm text-slate-500 italic">
            No exercises published yet. Come back when your coach adds some.
          </p>
        </div>
      ) : (
        <>
          <ol className="space-y-4">
            {exercises.map((ex, i) => (
              <li
                key={ex.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6"
              >
                <div className="flex items-start gap-3 mb-3">
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
                <label
                  htmlFor={`answer-${ex.id}`}
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Your answer
                </label>
                <textarea
                  id={`answer-${ex.id}`}
                  rows={4}
                  value={drafts[ex.id] ?? ""}
                  onChange={(e) => update(ex.id, e.target.value)}
                  placeholder="Type your answer here…"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y"
                />

                {marks[ex.id] && (marks[ex.id].score || marks[ex.id].comment) && (
                  <div className="mt-4 border border-amber-200 bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardCheck className="w-4 h-4 text-amber-700" aria-hidden="true" />
                      <span className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
                        Coach feedback
                      </span>
                    </div>
                    {marks[ex.id].score && (
                      <p className="text-sm text-amber-900 mb-1">
                        <span className="font-semibold">Score:</span>{" "}
                        <span className="font-bold">{marks[ex.id].score}</span>
                      </p>
                    )}
                    {marks[ex.id].comment && (
                      <p className="text-sm text-amber-900 whitespace-pre-wrap break-words">
                        {marks[ex.id].comment}
                      </p>
                    )}
                    {marks[ex.id].markedAt && (
                      <p className="text-xs text-amber-700 mt-2">
                        Marked {formatTime(marks[ex.id].markedAt!)}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={submit}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <Check className="w-5 h-5" />
              Submit Answers
            </button>
            {error && (
              <p className="text-sm text-rose-600 font-medium">{error}</p>
            )}
            {!error && savedAt && (
              <p className="text-sm text-emerald-700 font-medium">
                Saved! Your answers were stored on this device.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
