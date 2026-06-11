"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import Breadcrumb from "./Breadcrumb";
import type { QuizListRow } from "@/app/academy/training/quiz/actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface UpdateQuizesListProps {
  quizzes: QuizListRow[];
  canEdit?: boolean;
}

export default function UpdateQuizesList({
  quizzes,
  canEdit = true,
}: UpdateQuizesListProps) {
  void canEdit;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Academy", href: "/academy" },
            { label: "Training", href: "/academy/training" },
            { label: "Quiz", href: "/academy/training/quiz" },
            { label: "Update Quizes" },
          ]}
        />
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide">
            <span className="text-xl" aria-hidden="true">✏️</span>
            <span>UPDATE QUIZES</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-3 ml-1">
          Pick a quiz to edit. Changes save back to the same quiz.
        </p>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-amber-700 text-white">
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30 w-12">#</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">QUIZ TITLE</th>
                  <th className="text-center px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">QUESTIONS</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">STATUS</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">LAST UPDATED</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm italic text-slate-400"
                    >
                      No quizzes yet.
                    </td>
                  </tr>
                ) : (
                  quizzes.map((q, i) => {
                    const status = q.is_published ? "published" : "draft";
                    return (
                      <tr key={q.quiz_id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-500 border-r border-slate-100">{i + 1}</td>
                        <td className="px-6 py-3 font-semibold text-slate-900 border-r border-slate-100">{q.title}</td>
                        <td className="text-center px-6 py-3 text-sm text-slate-700 border-r border-slate-100 tabular-nums">
                          {q.question_count}
                        </td>
                        <td className="px-6 py-3 border-r border-slate-100">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                              q.is_published
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600 border-r border-slate-100">
                          {formatDate(q.updated_at)}
                        </td>
                        <td className="px-6 py-3">
                          <Link
                            href={`/academy/training/quiz/update/${q.quiz_id}`}
                            title={`Update ${q.title}`}
                            className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white px-3 h-8 rounded-md text-xs font-semibold"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Update
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
