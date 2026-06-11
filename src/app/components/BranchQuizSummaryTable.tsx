"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "academy.user.quiz.submissions";

export interface QuizSubmission {
  quizId: string;
  branch: string; // branch code, e.g. "ST", "SA"
  userEmail?: string;
  answeredAt: number;
}

interface Branch {
  name: string;
  code: string;
}

interface Props {
  branches: Branch[];
}

function loadSubmissions(): QuizSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function BranchQuizSummaryTable({ branches }: Props) {
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);

  useEffect(() => {
    const refresh = () => setSubmissions(loadSubmissions());
    refresh();

    // Cross-tab updates
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    // Refresh whenever the user returns to this page/tab
    const onFocus = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const total = submissions.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#9E86FA] text-white">
            <th className="text-left px-4 py-3 font-bold tracking-wide w-16 border-r border-white/30">NO</th>
            <th className="text-left px-4 py-3 font-bold tracking-wide border-r border-white/30">BRANCH</th>
            <th className="text-center px-4 py-3 font-bold tracking-wide border-r border-white/30">
              QUIZ ANSWERED
            </th>
            <th className="text-center px-4 py-3 font-bold tracking-wide">PERCENTAGE %</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b, i) => {
            const count = submissions.filter((s) => s.branch === b.code).length;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <tr key={b.code} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="text-center px-4 py-2.5 font-bold text-slate-900 border-r border-slate-100">
                  {i + 1}
                </td>
                <td className="px-4 py-2.5 font-bold text-slate-900 border-r border-slate-100">
                  {b.name} ({b.code})
                </td>
                <td className="text-center px-4 py-2.5 text-slate-700 border-r border-slate-100 tabular-nums">
                  {count}
                </td>
                <td className="text-center px-4 py-2.5 text-slate-700 tabular-nums">
                  {count > 0 ? `${pct.toFixed(1)}%` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
