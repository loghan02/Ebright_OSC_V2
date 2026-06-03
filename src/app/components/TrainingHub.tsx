"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FilePen, Plus, Minus, Trash2, X } from "lucide-react";
import Breadcrumb from "./Breadcrumb";

const STORAGE_KEY = "academy.training.courses";
const DEFAULT_COURSE_COUNT = 12;

const defaultCourses = (): number[] =>
  Array.from({ length: DEFAULT_COURSE_COUNT }, (_, i) => i + 1);

interface TrainingHubProps {
  canEdit?: boolean;
}

export default function TrainingHub({ canEdit = true }: TrainingHubProps = {}) {
  const [courses, setCourses] = useState<number[]>(defaultCourses);
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "number")) {
          setCourses(parsed);
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    } catch {
      // ignore
    }
  }, [courses, loaded]);

  const addCourse = () => {
    setCourses((prev) => {
      const nextN = prev.length ? Math.max(...prev) + 1 : 1;
      return [...prev, nextN];
    });
  };

  const confirmDelete = () => {
    if (pendingDelete == null) return;
    const n = pendingDelete;
    setCourses((prev) => prev.filter((c) => c !== n));
    try {
      localStorage.removeItem(`academy.training.course-${n}`);
    } catch {
      // ignore
    }
    setPendingDelete(null);
    setPickerOpen(false);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPendingDelete(null);
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-32">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Academy", href: "/academy" },
            { label: "Training" },
          ]}
        />
        <header className="mb-10">
          <h1 className="inline-flex items-center gap-3 text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            <FilePen className="w-8 h-8 md:w-9 md:h-9" aria-hidden="true" />
            <span>TRAINING</span>
          </h1>
        </header>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold tracking-wide text-slate-900 mb-6">COURSES</h2>
          {courses.length === 0 ? (
            <p className="text-slate-500 italic">No courses yet. Click <strong>Add Course</strong> to create the first one.</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {courses.map((n) => (
                <li key={n}>
                  <Link
                    href={`/academy/training/course-${n}`}
                    className="group block bg-emerald-200 hover:bg-emerald-300 rounded-2xl py-8 px-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  >
                    <div className="text-5xl mb-3" aria-hidden="true">📚</div>
                    <div className="font-bold tracking-wide text-emerald-900">COURSE {n}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={courses.length === 0 || !canEdit}
          className={`inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${canEdit ? "" : "opacity-60"}`}
        >
          <Minus className="w-5 h-5" />
          Delete Course
        </button>
        <button
          type="button"
          onClick={addCourse}
          disabled={!canEdit}
          className={`inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${canEdit ? "" : "opacity-60"}`}
        >
          <Plus className="w-5 h-5" />
          Add Course
        </button>
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 flex items-center justify-center px-4"
          onClick={closePicker}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {pendingDelete == null ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Delete a course</h3>
                  <button
                    type="button"
                    onClick={closePicker}
                    aria-label="Close"
                    className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Pick the course you want to delete. You&apos;ll be asked to confirm before anything is removed.
                </p>
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {courses.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPendingDelete(n)}
                      className="px-3 py-2.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-sm font-semibold text-slate-800 transition-colors"
                    >
                      COURSE {n}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Delete COURSE {pendingDelete}?
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      This will permanently remove the course and all of its saved content. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete course
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
