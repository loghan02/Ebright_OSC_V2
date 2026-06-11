"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Send,
  Plus,
  Copy,
  Trash2,
  Eye,
  Settings as SettingsIcon,
  Type as TypeIcon,
  Image as ImageIcon,
  PanelsTopBottom,
  CopyPlus,
  Undo2,
  Redo2,
  X,
} from "lucide-react";
import { BRANCHES } from "./branches";
import Breadcrumb from "./Breadcrumb";
import { saveQuiz, loadQuiz, type QuestionInput } from "@/app/academy/training/quiz/actions";

type QuestionType =
  | "multiple-choice"
  | "checkboxes"
  | "short-answer"
  | "paragraph"
  | "dropdown"
  | "title-block"
  | "image"
  | "section";

interface Question {
  id: string;
  title: string;
  description?: string; // used for title-block, image (caption), section
  type: QuestionType;
  options: string[];
  required: boolean;
  imageSrc?: string; // data URL or external URL for image blocks
  imageAlt?: string;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple-choice", label: "Multiple choice" },
  { value: "checkboxes", label: "Checkboxes" },
  { value: "short-answer", label: "Short answer" },
  { value: "paragraph", label: "Paragraph" },
  { value: "dropdown", label: "Dropdown" },
];

const newId = () => `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface QuizBuilderProps {
  editQuizId?: number;
  canEdit?: boolean;
}

const makeQuestion = (): Question => ({
  id: newId(),
  title: "",
  type: "multiple-choice",
  options: ["Option 1"],
  required: false,
});

const makeTitleBlock = (): Question => ({
  id: newId(),
  title: "",
  description: "",
  type: "title-block",
  options: [],
  required: false,
});

const makeImageBlock = (): Question => ({
  id: newId(),
  title: "",
  description: "",
  type: "image",
  options: [],
  required: false,
  imageSrc: "",
  imageAlt: "",
});

const makeSectionBlock = (): Question => ({
  id: newId(),
  title: "",
  description: "",
  type: "section",
  options: [],
  required: false,
});

export default function QuizBuilder({ editQuizId, canEdit = true }: QuizBuilderProps = {}) {
  const router = useRouter();
  const [currentQuizId, setCurrentQuizId] = useState<number | null>(editQuizId ?? null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([makeQuestion()]);
  const [history, setHistory] = useState<Question[][]>([]);
  const [redoStack, setRedoStack] = useState<Question[][]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(() => new Set());
  const [confirmPublish, setConfirmPublish] = useState(false);

  // If editing an existing quiz, hydrate state from the database on mount
  useEffect(() => {
    if (!editQuizId) return;
    let cancelled = false;
    (async () => {
      const result = await loadQuiz(editQuizId);
      if (cancelled || !result.ok) return;
      const quiz = result.data;
      setTitle(quiz.title);
      setDescription(quiz.description);
      setQuestions(
        quiz.questions.length > 0
          ? quiz.questions.map((q): Question => ({
              id: newId(),
              title: q.prompt,
              description: q.meta?.description,
              type: q.type,
              options: q.options.map((o) => o.label),
              required: q.is_required,
              imageSrc: q.meta?.imageSrc,
              imageAlt: q.meta?.imageAlt,
            }))
          : [makeQuestion()],
      );
      setSelectedBranches(new Set(quiz.publishedBranches));
    })();
    return () => {
      cancelled = true;
    };
  }, [editQuizId]);

  const pushHistory = () => {
    setHistory((h) => [...h.slice(-19), questions]);
    setRedoStack([]);
  };

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    pushHistory();
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const addQuestion = () => {
    pushHistory();
    setQuestions((qs) => {
      const next = [...qs, makeQuestion()];
      setActiveIdx(next.length - 1);
      return next;
    });
  };

  const addTitleBlock = () => {
    pushHistory();
    setQuestions((qs) => {
      const next = [...qs, makeTitleBlock()];
      setActiveIdx(next.length - 1);
      return next;
    });
  };

  const addImageBlock = () => {
    pushHistory();
    setQuestions((qs) => {
      const next = [...qs, makeImageBlock()];
      setActiveIdx(next.length - 1);
      return next;
    });
  };

  const addSectionBlock = () => {
    pushHistory();
    setQuestions((qs) => {
      const next = [...qs, makeSectionBlock()];
      setActiveIdx(next.length - 1);
      return next;
    });
  };

  const duplicateQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    pushHistory();
    setQuestions((qs) => {
      const src = qs[idx];
      if (!src) return qs;
      const copy: Question = {
        ...src,
        id: newId(),
        options: [...src.options],
      };
      const next = [...qs];
      next.splice(idx + 1, 0, copy);
      setActiveIdx(idx + 1);
      return next;
    });
  };

  const deleteQuestion = (idx: number) => {
    if (questions.length === 1) return;
    pushHistory();
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
    setActiveIdx((i) => Math.max(0, i - (i === idx ? 1 : 0)));
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [...r, questions]);
    setHistory((h) => h.slice(0, -1));
    setQuestions(prev);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, questions]);
    setRedoStack((r) => r.slice(0, -1));
    setQuestions(next);
  };

  const persist = async (status: "draft" | "published", branches?: string[]) => {
    setSaveError(null);
    const wasNewQuiz = currentQuizId === null;
    const payload = {
      quizId: currentQuizId ?? undefined,
      title: title.trim() || "Untitled form",
      description,
      questions: questions.map(
        (q): QuestionInput => ({
          title: q.title,
          description: q.description,
          type: q.type,
          options: q.options,
          required: q.required,
          imageSrc: q.imageSrc,
          imageAlt: q.imageAlt,
        }),
      ),
      status,
      publishedBranches: status === "published" ? branches ?? [] : undefined,
    };
    const result = await saveQuiz(payload);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setCurrentQuizId(result.data.quizId);
    setSavedAt(Date.now());
    if (wasNewQuiz) {
      // Move from /create to /update/[id] so reloads bring this quiz back.
      router.replace(`/academy/training/quiz/update/${result.data.quizId}`);
    }
  };

  const handleSave = () => {
    void persist("draft");
  };
  const handleOpenPublish = () => {
    setSelectedBranches(new Set());
    setConfirmPublish(false);
    setPublishOpen(true);
  };
  const handleConfirmedPublish = () => {
    void persist("published", Array.from(selectedBranches));
    setPublishOpen(false);
    setConfirmPublish(false);
    setSelectedBranches(new Set());
  };

  const allSelected = selectedBranches.size === BRANCHES.length;
  const toggleBranch = (code: string) => {
    setSelectedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };
  const toggleAll = () => {
    setSelectedBranches((prev) =>
      prev.size === BRANCHES.length ? new Set() : new Set(BRANCHES.map((b) => b.code)),
    );
  };

  return (
    <div className="min-h-full bg-slate-50">
      {!canEdit && (
        <div
          role="status"
          className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg px-4 py-1.5 text-sm font-semibold shadow"
        >
          View only — contact your administrator to edit.
        </div>
      )}
      <div className="max-w-3xl mx-auto px-6 pt-4 pb-20 relative">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Academy", href: "/academy" },
            { label: "Training", href: "/academy/training" },
            { label: "Quiz", href: "/academy/training/quiz" },
            { label: editQuizId ? "Update Quiz" : "Create Quiz" },
          ]}
        />
        {/* Header bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-6 flex items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide">
            <Plus className="w-4 h-4 text-violet-300" />
            <span>CREATE QUIZ</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {saveError && (
              <span className="text-xs text-rose-600 font-medium mr-2" role="alert">
                Save failed: {saveError}
              </span>
            )}
            {!saveError && savedAt && (
              <span className="text-xs text-slate-500 mr-2">
                Saved {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!canEdit}
              className={`inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl font-bold transition-colors ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
            >
              <Check className="w-4 h-4" />
              Save Quiz
            </button>
            <button
              type="button"
              onClick={handleOpenPublish}
              disabled={!canEdit}
              className={`inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl font-bold transition-colors ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
            >
              <Send className="w-4 h-4" />
              PUBLISH
            </button>
          </div>
        </div>

        {/* Form heading card */}
        <div className="bg-white border-t-8 border-teal-700 border-l border-r border-b border-slate-200 rounded-xl shadow-sm mb-5">
          <div className="p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled form"
              readOnly={!canEdit}
              className="w-full text-3xl font-light text-slate-800 placeholder:text-slate-400 bg-transparent border-0 border-b border-transparent focus:border-teal-600 focus:outline-none pb-2 mb-3"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Form description"
              readOnly={!canEdit}
              className="w-full text-sm text-slate-600 placeholder:text-slate-400 bg-transparent border-0 border-b border-transparent focus:border-teal-600 focus:outline-none pb-1"
            />
          </div>
        </div>

        {/* Question cards */}
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            isActive={idx === activeIdx}
            onActivate={() => setActiveIdx(idx)}
            onChange={(patch) => updateQuestion(idx, patch)}
            onDuplicate={() => duplicateQuestion(idx)}
            onDelete={() => deleteQuestion(idx)}
            canDelete={questions.length > 1}
            previewing={previewing}
            canEdit={canEdit}
          />
        ))}

        {/* Floating side toolbar */}
        <div className="hidden md:flex flex-col items-center gap-1 absolute -right-2 top-48 bg-white border border-slate-200 rounded-2xl shadow-sm py-2 px-1">
          <SideIconBtn label="Preview" active={previewing} onClick={() => setPreviewing((p) => !p)}>
            <Eye className="w-5 h-5" />
          </SideIconBtn>
          <SideIconBtn label="Quiz settings" onClick={() => setShowSettings(true)}>
            <SettingsIcon className="w-5 h-5" />
          </SideIconBtn>
          <SideDivider />
          <SideIconBtn label="Add question" onClick={addQuestion} disabled={!canEdit}>
            <Plus className="w-5 h-5" />
          </SideIconBtn>
          <SideIconBtn label="Add title block" onClick={addTitleBlock} disabled={!canEdit}>
            <TypeIcon className="w-5 h-5" />
          </SideIconBtn>
          <SideIconBtn label="Add image" onClick={addImageBlock} disabled={!canEdit}>
            <ImageIcon className="w-5 h-5" />
          </SideIconBtn>
          <SideIconBtn label="Add section" onClick={addSectionBlock} disabled={!canEdit}>
            <PanelsTopBottom className="w-5 h-5" />
          </SideIconBtn>
          <SideDivider />
          <SideIconBtn label="Duplicate current question" onClick={() => duplicateQuestion(activeIdx)} disabled={!canEdit}>
            <CopyPlus className="w-5 h-5" />
          </SideIconBtn>
          <SideIconBtn label="Undo" onClick={undo} disabled={!canEdit || history.length === 0}>
            <Undo2 className="w-5 h-5" />
          </SideIconBtn>
          <SideIconBtn label="Redo" onClick={redo} disabled={!canEdit || redoStack.length === 0}>
            <Redo2 className="w-5 h-5" />
          </SideIconBtn>
        </div>
      </div>

      {publishOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 flex items-center justify-center px-4"
          onClick={() => setPublishOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {!confirmPublish ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Publish quiz to branches</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Pick the branches that should see this quiz. You can select all at once.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublishOpen(false)}
                    aria-label="Close"
                    className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <label className="flex items-center gap-2 px-3 py-2 my-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={!canEdit}
                    className="rounded border-slate-300 w-4 h-4 accent-teal-600"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    Select all branches ({BRANCHES.length})
                  </span>
                </label>

                <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {BRANCHES.map((b) => (
                    <label
                      key={b.code}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBranches.has(b.code)}
                        onChange={() => toggleBranch(b.code)}
                        disabled={!canEdit}
                        className="rounded border-slate-300 w-4 h-4 accent-teal-600"
                      />
                      <span className="text-sm text-slate-700">
                        {b.name}{" "}
                        <span className="text-slate-400">({b.code})</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="text-xs text-slate-500 mt-3">
                  {selectedBranches.size === 0
                    ? "No branches selected yet."
                    : `${selectedBranches.size} branch${selectedBranches.size === 1 ? "" : "es"} selected.`}
                </div>

                <div className="flex items-center justify-end gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setPublishOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPublish(true)}
                    disabled={selectedBranches.size === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg"
                  >
                    <Send className="w-4 h-4" />
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Publish this quiz?</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      The quiz will be marked as <strong>Published</strong> and made available to{" "}
                      <strong>{selectedBranches.size}</strong>{" "}
                      {selectedBranches.size === 1 ? "branch" : "branches"}:
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto text-sm text-slate-700">
                  {Array.from(selectedBranches)
                    .map((code) => BRANCHES.find((b) => b.code === code))
                    .filter((b): b is { name: string; code: string } => Boolean(b))
                    .map((b) => `${b.name} (${b.code})`)
                    .join(" · ")}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmPublish(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmedPublish}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg"
                  >
                    <Send className="w-4 h-4" />
                    Publish quiz
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 flex items-center justify-center px-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">Quiz settings</h3>
            <p className="text-sm text-slate-600 mb-4">
              Settings like &quot;show correct answers&quot;, &quot;randomize order&quot;, scoring,
              etc. will live here.
            </p>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="w-full px-4 py-2 text-sm font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  isActive,
  onActivate,
  onChange,
  onDuplicate,
  onDelete,
  canDelete,
  previewing,
  canEdit,
}: {
  question: Question;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onChange: (patch: Partial<Question>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
  previewing: boolean;
  canEdit: boolean;
}) {
  const choiceLike =
    question.type === "multiple-choice" || question.type === "checkboxes" || question.type === "dropdown";
  const isTitleBlock = question.type === "title-block";
  const isImage = question.type === "image";
  const isSection = question.type === "section";

  const handleImageUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ imageSrc: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const updateOption = (i: number, value: string) => {
    const opts = [...question.options];
    opts[i] = value;
    onChange({ options: opts });
  };

  const addOption = () => {
    onChange({ options: [...question.options, `Option ${question.options.length + 1}`] });
  };

  const removeOption = (i: number) => {
    if (question.options.length === 1) return;
    onChange({ options: question.options.filter((_, idx) => idx !== i) });
  };

  return (
    <div
      onClick={onActivate}
      className={`bg-white border-l-4 ${
        isActive ? "border-l-teal-600" : "border-l-transparent"
      } border-t border-r border-b border-slate-200 rounded-xl shadow-sm mb-4 transition-colors`}
    >
      <div className="p-6">
        {isSection && (
          <div className="border-t-4 border-teal-600 -mx-6 -mt-6 mb-4 px-6 pt-4 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
              Section break
            </span>
          </div>
        )}
        {isImage ? (
          <div className="space-y-3">
            <input
              type="text"
              value={question.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Image caption (optional)"
              disabled={previewing}
              readOnly={!canEdit}
              className="w-full text-base text-slate-800 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-600 focus:outline-none focus:bg-white"
            />
            {question.imageSrc ? (
              <div className="relative inline-block max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.imageSrc}
                  alt={question.imageAlt ?? ""}
                  className="max-w-full max-h-96 rounded-lg border border-slate-200"
                />
                {!previewing && (
                  <button
                    type="button"
                    onClick={() => onChange({ imageSrc: "" })}
                    title="Remove image"
                    disabled={!canEdit}
                    className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 border border-slate-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center shadow ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : !previewing ? (
              <label className="block border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl py-10 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                  disabled={!canEdit}
                />
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm font-semibold text-slate-700">
                  Click to upload an image
                </span>
                <span className="block text-xs text-slate-500 mt-1">
                  PNG, JPG, GIF — embedded as a data URL
                </span>
              </label>
            ) : (
              <div className="text-sm italic text-slate-400">(no image)</div>
            )}
            {question.imageSrc && !previewing && (
              <input
                type="text"
                value={question.imageAlt ?? ""}
                onChange={(e) => onChange({ imageAlt: e.target.value })}
                placeholder="Alt text (for accessibility)"
                readOnly={!canEdit}
                className="w-full text-xs text-slate-600 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 focus:border-teal-600 focus:outline-none focus:bg-white"
              />
            )}
          </div>
        ) : isTitleBlock || isSection ? (
          <div className="space-y-2">
            <input
              type="text"
              value={question.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={isSection ? "Section title" : "Section title"}
              disabled={previewing}
              readOnly={!canEdit}
              className="w-full text-2xl font-semibold text-slate-800 placeholder:text-slate-400 bg-transparent border-0 border-b border-transparent focus:border-teal-600 focus:outline-none pb-1"
            />
            <input
              type="text"
              value={question.description ?? ""}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Description"
              disabled={previewing}
              readOnly={!canEdit}
              className="w-full text-sm text-slate-600 placeholder:text-slate-400 bg-transparent border-0 border-b border-transparent focus:border-teal-600 focus:outline-none pb-1"
            />
          </div>
        ) : (
          <div className="flex items-start gap-4 mb-4">
            <input
              type="text"
              value={question.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={`Untitled Question`}
              disabled={previewing}
              readOnly={!canEdit}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:bg-white"
            />
            {!previewing && (
              <select
                value={question.type}
                onChange={(e) => onChange({ type: e.target.value as QuestionType })}
                disabled={!canEdit}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 focus:outline-none focus:border-teal-600"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {choiceLike && (
          <div className="space-y-2 mb-2">
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <span className="flex-shrink-0">
                  {question.type === "checkboxes" ? (
                    <span className="block w-4 h-4 border border-slate-300 rounded-sm" />
                  ) : question.type === "dropdown" ? (
                    <span className="text-sm text-slate-400 font-mono">{i + 1}.</span>
                  ) : (
                    <span className="block w-4 h-4 border border-slate-300 rounded-full" />
                  )}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  disabled={previewing}
                  readOnly={!canEdit}
                  className="flex-1 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-teal-600 focus:outline-none text-sm py-1 text-slate-800"
                />
                {!previewing && question.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    aria-label="Remove option"
                    disabled={!canEdit}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-600 ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {!previewing && (
              <button
                type="button"
                onClick={addOption}
                disabled={!canEdit}
                className={`flex items-center gap-3 text-sm text-slate-500 hover:text-teal-700 pl-0 ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
              >
                <span className="block w-4 h-4 border border-slate-300 rounded-full" />
                <span>Add option</span>
              </button>
            )}
          </div>
        )}

        {question.type === "short-answer" && (
          <div className="text-sm text-slate-400 italic border-b border-dashed border-slate-300 pb-1">
            Short answer text
          </div>
        )}

        {question.type === "paragraph" && (
          <div className="text-sm text-slate-400 italic border-b border-dashed border-slate-300 pb-1">
            Long answer text
          </div>
        )}
      </div>

      {!previewing && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              disabled={!canEdit}
              className="rounded border-slate-300"
            />
            Required
          </label>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 mr-2">Q{index + 1}</span>
            <button
              type="button"
              onClick={onDuplicate}
              aria-label="Duplicate"
              title="Duplicate"
              disabled={!canEdit}
              className={`w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 flex items-center justify-center ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={!canEdit || !canDelete}
              aria-label="Delete"
              title="Delete"
              className={`w-8 h-8 rounded-md text-rose-600 hover:bg-rose-50 disabled:text-slate-300 disabled:hover:bg-transparent flex items-center justify-center ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SideIconBtn({
  children,
  label,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
        active
          ? "bg-teal-100 text-teal-700"
          : "text-slate-600 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
      }`}
    >
      {children}
    </button>
  );
}

function SideDivider() {
  return <div className="w-6 h-px bg-slate-200 my-1" />;
}
