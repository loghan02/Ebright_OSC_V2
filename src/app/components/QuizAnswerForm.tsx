"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { submitQuizAnswers, type AnswerQuiz } from "@/app/academy/training/quiz/actions";

interface Props {
  quiz: AnswerQuiz;
}

// Per-question student state. text for text inputs, selected for option ids.
interface DraftAnswer {
  text: string;
  selected: number[]; // option_ids
}

const emptyDraft = (): DraftAnswer => ({ text: "", selected: [] });

export default function QuizAnswerForm({ quiz }: Props) {
  const [drafts, setDrafts] = useState<Record<number, DraftAnswer>>(() => {
    const init: Record<number, DraftAnswer> = {};
    for (const q of quiz.questions) init[q.question_id] = emptyDraft();
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | null
    | {
        submittedAt: string;
        score: { obtained: number; possible: number } | null;
      }
  >(null);

  const updateText = (qid: number, text: string) => {
    setDrafts((prev) => ({ ...prev, [qid]: { ...(prev[qid] ?? emptyDraft()), text } }));
  };

  const updateRadio = (qid: number, optionId: number) => {
    setDrafts((prev) => ({ ...prev, [qid]: { ...(prev[qid] ?? emptyDraft()), selected: [optionId] } }));
  };

  const updateCheckbox = (qid: number, optionId: number, checked: boolean) => {
    setDrafts((prev) => {
      const cur = prev[qid] ?? emptyDraft();
      const set = new Set(cur.selected);
      if (checked) set.add(optionId);
      else set.delete(optionId);
      return { ...prev, [qid]: { ...cur, selected: [...set] } };
    });
  };

  const handleSubmit = async () => {
    setError(null);

    // Required-field check (skip display-only blocks)
    for (const q of quiz.questions) {
      if (q.type === "title-block" || q.type === "image" || q.type === "section") continue;
      if (!q.is_required) continue;
      const d = drafts[q.question_id] ?? emptyDraft();
      const hasText = d.text.trim().length > 0;
      const hasChoice = d.selected.length > 0;
      if (!hasText && !hasChoice) {
        setError(`Please answer question ${q.position + 1}: ${q.prompt || "(no prompt)"}`);
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      quiz_id: quiz.quiz_id,
      answers: quiz.questions
        .filter((q) => q.type !== "title-block" && q.type !== "image" && q.type !== "section")
        .map((q) => {
          const d = drafts[q.question_id] ?? emptyDraft();
          return {
            question_id: q.question_id,
            text_answer: d.text.trim().length > 0 ? d.text : null,
            selected_options: d.selected,
          };
        }),
    };

    const res = await submitQuizAnswers(payload);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult({ submittedAt: res.data.submitted_at, score: res.data.score });
  };

  if (result) {
    return (
      <div className="bg-white border border-emerald-300 rounded-2xl p-8 text-center my-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
          <Check className="w-8 h-8 text-emerald-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Submitted!</h1>
        <p className="text-sm text-slate-600 mb-4">
          Your answers were recorded {new Date(result.submittedAt).toLocaleString()}.
        </p>
        {result.score && (
          <p className="text-lg font-semibold text-slate-900 mb-6">
            Auto-graded score:{" "}
            <span className="text-emerald-700">
              {result.score.obtained} / {result.score.possible}
            </span>
            <span className="block text-xs font-normal text-slate-500 mt-1">
              (only multiple-choice / checkbox / dropdown questions are auto-graded;
              text answers are reviewed by your coach)
            </span>
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/academy/training/quiz/existing"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to quizzes
          </Link>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl"
          >
            Edit and resubmit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
          {quiz.title || "Untitled quiz"}
        </h1>
        {quiz.description && (
          <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{quiz.description}</p>
        )}
        {!quiz.is_published && (
          <p
            role="status"
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 border border-amber-300 rounded-md px-2.5 py-1"
          >
            Draft — not published yet
          </p>
        )}
      </header>

      <ol className="space-y-4">
        {quiz.questions.map((q, i) => {
          const d = drafts[q.question_id] ?? emptyDraft();
          const num = i + 1;

          // Display-only blocks
          if (q.type === "title-block") {
            return (
              <li
                key={q.question_id}
                className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6"
              >
                <h3 className="text-lg font-bold text-slate-900">{q.prompt}</h3>
                {q.meta?.description && (
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                    {q.meta.description}
                  </p>
                )}
              </li>
            );
          }
          if (q.type === "section") {
            return (
              <li
                key={q.question_id}
                className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-5 md:p-6"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                  Section
                </p>
                <h3 className="text-base font-bold text-slate-900">{q.prompt}</h3>
                {q.meta?.description && (
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                    {q.meta.description}
                  </p>
                )}
              </li>
            );
          }
          if (q.type === "image") {
            return (
              <li
                key={q.question_id}
                className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6"
              >
                {q.meta?.imageSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.meta.imageSrc}
                    alt={q.meta.imageAlt ?? q.prompt ?? ""}
                    className="max-w-full rounded-lg"
                  />
                )}
                {q.prompt && <p className="text-sm text-slate-700 mt-2">{q.prompt}</p>}
              </li>
            );
          }

          // Real questions
          return (
            <li
              key={q.question_id}
              className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0 mt-0.5">
                  {num}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap break-words font-medium">
                    {q.prompt || <span className="italic text-slate-400">(no prompt)</span>}
                    {q.is_required && <span className="text-rose-600 ml-1">*</span>}
                  </p>
                  {q.meta?.description && (
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">
                      {q.meta.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pl-10">
                {q.type === "short-answer" && (
                  <input
                    type="text"
                    value={d.text}
                    onChange={(e) => updateText(q.question_id, e.target.value)}
                    placeholder="Your answer"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                )}

                {q.type === "paragraph" && (
                  <textarea
                    rows={4}
                    value={d.text}
                    onChange={(e) => updateText(q.question_id, e.target.value)}
                    placeholder="Your answer"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y"
                  />
                )}

                {q.type === "multiple-choice" && (
                  <ul className="space-y-2">
                    {q.options.map((o) => (
                      <li key={o.option_id}>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-800">
                          <input
                            type="radio"
                            name={`q-${q.question_id}`}
                            checked={d.selected[0] === o.option_id}
                            onChange={() => updateRadio(q.question_id, o.option_id)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{o.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}

                {q.type === "checkboxes" && (
                  <ul className="space-y-2">
                    {q.options.map((o) => (
                      <li key={o.option_id}>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-800">
                          <input
                            type="checkbox"
                            checked={d.selected.includes(o.option_id)}
                            onChange={(e) => updateCheckbox(q.question_id, o.option_id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                          />
                          <span>{o.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}

                {q.type === "dropdown" && (
                  <select
                    value={d.selected[0] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        setDrafts((prev) => ({
                          ...prev,
                          [q.question_id]: { ...(prev[q.question_id] ?? emptyDraft()), selected: [] },
                        }));
                      } else {
                        updateRadio(q.question_id, Number.parseInt(v, 10));
                      }
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">Choose…</option>
                    {q.options.map((o) => (
                      <option key={o.option_id} value={o.option_id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Check className="w-5 h-5" />
          {submitting ? "Submitting…" : "Submit Answers"}
        </button>
        {error && (
          <p className="text-sm text-rose-600 font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
