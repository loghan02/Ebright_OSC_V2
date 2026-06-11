"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Paperclip } from "lucide-react";

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
  score: string;       // kept as string so empty input doesn't NaN
  comment: string;
  markedAt: number | null;
}

type Marks = Record<string, MarkEntry>;

interface Props {
  courseSlug: string;
  courseNum: string;
}

const emptyMark = (): MarkEntry => ({ score: "", comment: "", markedAt: null });

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function CourseReviewForm({ courseSlug, courseNum }: Props) {
  const exercisesKey = `academy.training.${courseSlug}.exercises`;
  const answersKey = `academy.training.${courseSlug}.answers`;
  const marksKey = `academy.training.${courseSlug}.marks`;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [marks, setMarks] = useState<Marks>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let parsedExercises: Exercise[] = [];
    try {
      const raw = localStorage.getItem(exercisesKey);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) parsedExercises = p as Exercise[];
      }
    } catch {
      // ignore
    }
    setExercises(parsedExercises);

    let parsedAnswers: Answers = {};
    try {
      const raw = localStorage.getItem(answersKey);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === "object") parsedAnswers = p as Answers;
      }
    } catch {
      // ignore
    }
    setAnswers(parsedAnswers);

    let parsedMarks: Marks = {};
    try {
      const raw = localStorage.getItem(marksKey);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === "object") parsedMarks = p as Marks;
      }
    } catch {
      // ignore
    }
    // Ensure every exercise has a draft mark entry (empty if not yet marked)
    const filled: Marks = {};
    for (const ex of parsedExercises) {
      filled[ex.id] = parsedMarks[ex.id] ?? emptyMark();
    }
    setMarks(filled);

    setLoaded(true);
  }, [exercisesKey, answersKey, marksKey]);

  const updateScore = (id: string, value: string) => {
    setMarks((prev) => ({ ...prev, [id]: { ...(prev[id] ?? emptyMark()), score: value } }));
    setSavedAt(null);
  };

  const updateComment = (id: string, value: string) => {
    setMarks((prev) => ({ ...prev, [id]: { ...(prev[id] ?? emptyMark()), comment: value } }));
    setSavedAt(null);
  };

  const save = () => {
    setError(null);
    const now = Date.now();
    const next: Marks = {};
    for (const ex of exercises) {
      const draft = marks[ex.id] ?? emptyMark();
      const score = draft.score.trim();
      const comment = draft.comment.trim();
      if (score || comment) {
        next[ex.id] = {
          score,
          comment,
          markedAt: now,
        };
      }
    }
    try {
      localStorage.setItem(marksKey, JSON.stringify(next));
      setSavedAt(now);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(`Could not save marks: ${msg}`);
    }
  };

  if (!loaded) {
    return <p className="text-sm text-slate-400 italic">Loading…</p>;
  }

  return (
    <div>
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="inline-flex items-center gap-3 text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
          <ClipboardCheck className="w-8 h-8 md:w-9 md:h-9" aria-hidden="true" />
          <span>COURSE {courseNum} — Mark Answers</span>
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
            No exercises published yet. Publish some first, then come back to mark answers.
          </p>
        </div>
      ) : (
        <>
          <ol className="space-y-5">
            {exercises.map((ex, i) => {
              const answer = answers[ex.id];
              const mark = marks[ex.id] ?? emptyMark();
              return (
                <li
                  key={ex.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6"
                >
                  {/* Exercise heading */}
                  <div className="flex items-start gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">Question</p>
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

                  {/* Student answer */}
                  <div className="mb-4 pl-10">
                    <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Student answer
                    </p>
                    {answer ? (
                      <>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words bg-slate-50 border border-slate-200 rounded-lg p-3">
                          {answer.text}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Submitted {formatTime(answer.answeredAt)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm italic text-slate-400">
                        No answer submitted yet.
                      </p>
                    )}
                  </div>

                  {/* Coach mark */}
                  <div className="pl-10 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 items-start">
                    <div>
                      <label
                        htmlFor={`score-${ex.id}`}
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Score
                      </label>
                      <input
                        id={`score-${ex.id}`}
                        type="text"
                        inputMode="numeric"
                        value={mark.score}
                        onChange={(e) => updateScore(ex.id, e.target.value)}
                        placeholder="e.g. 8/10"
                        className="w-32 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`comment-${ex.id}`}
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Feedback
                      </label>
                      <textarea
                        id={`comment-${ex.id}`}
                        rows={3}
                        value={mark.comment}
                        onChange={(e) => updateComment(ex.id, e.target.value)}
                        placeholder="Comments for the student…"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-y"
                      />
                      {mark.markedAt && (
                        <p className="text-xs text-slate-400 mt-1">
                          Last marked {formatTime(mark.markedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <ClipboardCheck className="w-5 h-5" />
              Save Marks
            </button>
            {error && (
              <p className="text-sm text-rose-600 font-medium">{error}</p>
            )}
            {!error && savedAt && (
              <p className="text-sm text-emerald-700 font-medium">
                Saved.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
