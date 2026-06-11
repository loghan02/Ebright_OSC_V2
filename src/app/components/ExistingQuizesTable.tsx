"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Play } from "lucide-react";
import Breadcrumb from "./Breadcrumb";
import type { QuizListRow } from "@/app/academy/training/quiz/actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ExistingQuizesTableProps {
  quizzes: QuizListRow[];
  canEdit?: boolean;
}

export default function ExistingQuizesTable({
  quizzes,
  canEdit = true,
}: ExistingQuizesTableProps) {
  void canEdit;
  const [previewQuiz, setPreviewQuiz] = useState<number | null>(null);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Academy", href: "/academy" },
            { label: "Training", href: "/academy/training" },
            { label: "Quiz", href: "/academy/training/quiz" },
            { label: "Existing Quizes" },
          ]}
        />
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide">
            <span className="text-xl" aria-hidden="true">📚</span>
            <span>EXISTING QUIZES</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-amber-700 text-white">
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30 w-12">#</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">QUIZ TITLE</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">QUESTIONS</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">CREATED</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm italic text-slate-400"
                    >
                      No quizzes yet.
                    </td>
                  </tr>
                ) : (
                  quizzes.map((q, i) => (
                    <tr key={q.quiz_id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-500 border-r border-slate-100">{i + 1}</td>
                      <td className="px-6 py-3 font-semibold text-slate-900 border-r border-slate-100">{q.title}</td>
                      <td className="px-6 py-3 text-sm text-slate-700 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums">{q.question_count}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewQuiz(q.quiz_id)}
                            title="Preview quiz before answering"
                            aria-label={`Preview ${q.title}`}
                            className="w-7 h-7 rounded-md text-amber-700 hover:bg-amber-50 flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600 border-r border-slate-100">{formatDate(q.created_at)}</td>
                      <td className="px-6 py-3">
                        <Link
                          href={`/academy/training/quiz/answer/${q.quiz_id}`}
                          title="Answer Quiz"
                          aria-label={`Answer ${q.title}`}
                          className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white px-3 h-8 rounded-md text-xs font-semibold"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Answer Quiz
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {previewQuiz != null && (() => {
          const q = quizzes.find((x) => x.quiz_id === previewQuiz);
          if (!q) return null;
          const status = q.is_published ? "published" : "draft";
          return (
            <div
              className="fixed inset-0 bg-slate-900/40 z-40 flex items-center justify-center px-4"
              onClick={() => setPreviewQuiz(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{q.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {q.question_count} question{q.question_count === 1 ? "" : "s"} · {status}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      q.is_published
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-slate-500 italic mb-5">
                  Quiz preview will appear here once the Create Quizes flow is built.
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewQuiz(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewQuiz(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg"
                  >
                    Start quiz
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
