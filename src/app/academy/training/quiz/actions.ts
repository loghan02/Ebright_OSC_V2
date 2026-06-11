"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import { smsSyllabus } from "@/lib/sms-syllabus-db";
import { canEditAcademy } from "@/lib/academy-permissions";

// -----------------------------------------------------------------------------
// Shared types — kept in sync with QuizBuilder.tsx
// -----------------------------------------------------------------------------

export type QuestionType =
  | "multiple-choice"
  | "checkboxes"
  | "short-answer"
  | "paragraph"
  | "dropdown"
  | "title-block"
  | "image"
  | "section";

export interface QuestionInput {
  title: string;
  description?: string;
  type: QuestionType;
  options: string[];
  required: boolean;
  imageSrc?: string;
  imageAlt?: string;
}

export interface SaveQuizInput {
  quizId?: number;
  title: string;
  description: string;
  questions: QuestionInput[];
  status: "draft" | "published";
  publishedBranches?: string[]; // branch codes (e.g. "ST", "SA")
}

export interface QuizListRow {
  quiz_id: number;
  title: string;
  question_count: number;
  is_published: boolean;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface LoadedQuestion {
  position: number;
  type: QuestionType;
  prompt: string;
  is_required: boolean;
  meta: { description?: string; imageSrc?: string; imageAlt?: string } | null;
  options: { label: string; position: number }[];
}

export interface LoadedQuiz {
  quiz_id: number;
  title: string;
  description: string;
  is_published: boolean;
  questions: LoadedQuestion[];
  publishedBranches: string[]; // branch codes
}

// What students see — same as LoadedQuiz but options carry their option_id so
// the client can submit option-id references back. `is_correct` is intentionally
// omitted so students can't inspect the answer client-side.
export interface AnswerQuestion {
  question_id: number;
  position: number;
  type: QuestionType;
  prompt: string;
  is_required: boolean;
  meta: { description?: string; imageSrc?: string; imageAlt?: string } | null;
  options: { option_id: number; label: string; position: number }[];
}

export interface AnswerQuiz {
  quiz_id: number;
  title: string;
  description: string;
  is_published: boolean;
  questions: AnswerQuestion[];
}

export interface AnswerSubmissionInput {
  quiz_id: number;
  answers: {
    question_id: number;
    text_answer?: string | null;
    selected_options?: number[];
  }[];
}

export interface SubmissionResult {
  submission_id: number;
  submitted_at: string; // ISO
  score: { obtained: number; possible: number } | null;
}

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const CHOICE_TYPES: QuestionType[] = ["multiple-choice", "checkboxes", "dropdown"];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

async function requireUser(): Promise<
  { ok: true; userId: number; role: string } | { ok: false; error: string }
> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  const user = await prisma.users.findUnique({
    where: { email },
    select: { user_id: true, role: { select: { role_type: true } } },
  });
  if (!user) return { ok: false, error: "User not found" };

  return {
    ok: true,
    userId: user.user_id,
    role: user.role?.role_type ?? "",
  };
}

function buildMeta(q: QuestionInput): Record<string, string> | undefined {
  const meta: Record<string, string> = {};
  if (q.description !== undefined && q.description !== "") meta.description = q.description;
  if (q.imageSrc !== undefined && q.imageSrc !== "") meta.imageSrc = q.imageSrc;
  if (q.imageAlt !== undefined && q.imageAlt !== "") meta.imageAlt = q.imageAlt;
  return Object.keys(meta).length > 0 ? meta : undefined;
}

// -----------------------------------------------------------------------------
// Save (create or update)
// -----------------------------------------------------------------------------

export async function saveQuiz(input: SaveQuizInput): Promise<ActionResult<{ quizId: number }>> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (!canEditAcademy(auth.role)) {
    return { ok: false, error: "You do not have permission to save quizzes." };
  }

  const isPublished = input.status === "published";

  // Resolve branch codes → branch_ids via the MAIN database
  let branchIds: number[] = [];
  if (isPublished && input.publishedBranches && input.publishedBranches.length > 0) {
    const rows = await prisma.branch.findMany({
      where: { branch_code: { in: input.publishedBranches } },
      select: { branch_id: true },
    });
    branchIds = rows.map((r) => r.branch_id);
  }

  try {
    const result = await smsSyllabus.$transaction(async (tx) => {
      let quizId: number;

      if (input.quizId) {
        await tx.academy_quiz.update({
          where: { quiz_id: input.quizId },
          data: {
            title: input.title.trim() || "Untitled form",
            description: input.description,
            is_published: isPublished,
            published_at: isPublished ? new Date() : null,
          },
        });
        quizId = input.quizId;
        // Replace child rows
        await tx.academy_quiz_question.deleteMany({ where: { quiz_id: quizId } });
        await tx.academy_quiz_branch.deleteMany({ where: { quiz_id: quizId } });
      } else {
        const created = await tx.academy_quiz.create({
          data: {
            title: input.title.trim() || "Untitled form",
            description: input.description,
            is_published: isPublished,
            published_at: isPublished ? new Date() : null,
            created_by_user_id: auth.userId,
          },
        });
        quizId = created.quiz_id;
      }

      for (let i = 0; i < input.questions.length; i++) {
        const q = input.questions[i];
        const question = await tx.academy_quiz_question.create({
          data: {
            quiz_id: quizId,
            position: i,
            type: q.type,
            prompt: q.title,
            is_required: q.required,
            meta: buildMeta(q),
          },
        });
        if (q.options.length > 0 && CHOICE_TYPES.includes(q.type)) {
          await tx.academy_quiz_question_option.createMany({
            data: q.options.map((label, idx) => ({
              question_id: question.question_id,
              position: idx,
              label,
              is_correct: false,
            })),
          });
        }
      }

      if (branchIds.length > 0) {
        await tx.academy_quiz_branch.createMany({
          data: branchIds.map((branch_id) => ({ quiz_id: quizId, branch_id })),
        });
      }

      return { quizId };
    });

    return { ok: true, data: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Save failed";
    return { ok: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// List (for ExistingQuizesTable / UpdateQuizesList)
// -----------------------------------------------------------------------------

export async function listQuizzes(): Promise<ActionResult<QuizListRow[]>> {
  const auth = await requireUser();
  if (!auth.ok) {
    console.error("[listQuizzes] auth failed:", auth.error);
    return auth;
  }

  try {
    const rows = await smsSyllabus.academy_quiz.findMany({
      orderBy: { updated_at: "desc" },
      select: {
        quiz_id: true,
        title: true,
        is_published: true,
        created_at: true,
        updated_at: true,
        _count: { select: { questions: true } },
      },
    });

    console.log(`[listQuizzes] fetched ${rows.length} quizzes`);

    return {
      ok: true,
      data: rows.map((r) => ({
        quiz_id: r.quiz_id,
        title: r.title,
        question_count: r._count.questions,
        is_published: r.is_published,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
      })),
    };
  } catch (err) {
    console.error("[listQuizzes] query failed:", err);
    const msg = err instanceof Error ? err.message : "List failed";
    return { ok: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Load single quiz (for QuizBuilder edit mode)
// -----------------------------------------------------------------------------

export async function loadQuiz(quizId: number): Promise<ActionResult<LoadedQuiz>> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  try {
    const quiz = await smsSyllabus.academy_quiz.findUnique({
      where: { quiz_id: quizId },
      include: {
        questions: {
          orderBy: { position: "asc" },
          include: {
            options: { orderBy: { position: "asc" } },
          },
        },
        branches: true,
      },
    });

    if (!quiz) return { ok: false, error: "Quiz not found" };

    // Resolve branch_ids back to branch codes via the main DB
    const branchIds = quiz.branches.map((b) => b.branch_id);
    let branchCodes: string[] = [];
    if (branchIds.length > 0) {
      const rows = await prisma.branch.findMany({
        where: { branch_id: { in: branchIds } },
        select: { branch_code: true },
      });
      branchCodes = rows.map((r) => r.branch_code).filter((c): c is string => !!c);
    }

    return {
      ok: true,
      data: {
        quiz_id: quiz.quiz_id,
        title: quiz.title,
        description: quiz.description ?? "",
        is_published: quiz.is_published,
        questions: quiz.questions.map((q) => ({
          position: q.position,
          type: q.type as QuestionType,
          prompt: q.prompt,
          is_required: q.is_required,
          meta: q.meta as LoadedQuestion["meta"],
          options: q.options.map((o) => ({ label: o.label, position: o.position })),
        })),
        publishedBranches: branchCodes,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Load failed";
    return { ok: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Delete
// -----------------------------------------------------------------------------

export async function deleteQuiz(quizId: number): Promise<ActionResult<null>> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (!canEditAcademy(auth.role)) {
    return { ok: false, error: "You do not have permission to delete quizzes." };
  }

  try {
    await smsSyllabus.academy_quiz.delete({ where: { quiz_id: quizId } });
    return { ok: true, data: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    return { ok: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Student-side: load quiz for taking (no is_correct exposed)
// -----------------------------------------------------------------------------

export async function loadQuizForAnswering(quizId: number): Promise<ActionResult<AnswerQuiz>> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  try {
    const quiz = await smsSyllabus.academy_quiz.findUnique({
      where: { quiz_id: quizId },
      include: {
        questions: {
          orderBy: { position: "asc" },
          include: {
            options: {
              orderBy: { position: "asc" },
              select: { option_id: true, label: true, position: true },
            },
          },
        },
      },
    });

    if (!quiz) return { ok: false, error: "Quiz not found" };

    return {
      ok: true,
      data: {
        quiz_id: quiz.quiz_id,
        title: quiz.title,
        description: quiz.description ?? "",
        is_published: quiz.is_published,
        questions: quiz.questions.map((q) => ({
          question_id: q.question_id,
          position: q.position,
          type: q.type as QuestionType,
          prompt: q.prompt,
          is_required: q.is_required,
          meta: q.meta as AnswerQuestion["meta"],
          options: q.options,
        })),
      },
    };
  } catch (err) {
    console.error("[loadQuizForAnswering] failed:", err);
    const msg = err instanceof Error ? err.message : "Load failed";
    return { ok: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Student-side: submit answers
//
// Upsert behaviour — re-submitting the same quiz replaces previous answers
// for that (quiz_id, user_id, branch_id) tuple. Choice-style questions
// (multiple-choice / checkboxes / dropdown) are auto-graded against the
// is_correct flag on options; text answers are left ungraded (is_correct = null).
// -----------------------------------------------------------------------------

export async function submitQuizAnswers(
  input: AnswerSubmissionInput,
): Promise<ActionResult<SubmissionResult>> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  // Resolve the student's branch (if they have one) via the main DB
  const employment = await prisma.employment.findFirst({
    where: { user_id: auth.userId, status: "active" },
    select: { branch_id: true },
  });
  const branchId = employment?.branch_id ?? null;

  try {
    // Load the quiz with options to score choice questions
    const quiz = await smsSyllabus.academy_quiz.findUnique({
      where: { quiz_id: input.quiz_id },
      include: {
        questions: { include: { options: true } },
      },
    });
    if (!quiz) return { ok: false, error: "Quiz not found" };

    // Build a map for scoring
    const questionsById = new Map(quiz.questions.map((q) => [q.question_id, q]));
    const CHOICE_TYPES_SET = new Set<string>(CHOICE_TYPES);

    let obtained = 0;
    let possible = 0;

    const scored = input.answers.map((a) => {
      const q = questionsById.get(a.question_id);
      if (!q) return null;

      // Skip display-only blocks
      if (q.type === "title-block" || q.type === "image" || q.type === "section") {
        return null;
      }

      let is_correct: boolean | null = null;

      if (CHOICE_TYPES_SET.has(q.type)) {
        possible += 1;
        const correctIds = new Set(q.options.filter((o) => o.is_correct).map((o) => o.option_id));
        const selected = new Set(a.selected_options ?? []);
        // Exact match: same size + all elements present
        const matches =
          correctIds.size > 0 &&
          selected.size === correctIds.size &&
          [...selected].every((id) => correctIds.has(id));
        is_correct = matches;
        if (matches) obtained += 1;
      }

      return {
        question_id: a.question_id,
        text_answer: a.text_answer && a.text_answer.trim().length > 0 ? a.text_answer : null,
        selected_options: a.selected_options ?? [],
        is_correct,
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    // Upsert submission + replace answers in one transaction
    const submission = await smsSyllabus.$transaction(async (tx) => {
      const existing = await tx.academy_quiz_submission.findFirst({
        where: {
          quiz_id: input.quiz_id,
          user_id: auth.userId,
          branch_id: branchId,
        },
        select: { submission_id: true },
      });

      const submittedAt = new Date();
      const score = possible > 0 ? obtained : null;

      let submissionId: number;
      if (existing) {
        submissionId = existing.submission_id;
        await tx.academy_quiz_submission.update({
          where: { submission_id: submissionId },
          data: { submitted_at: submittedAt, score },
        });
        await tx.academy_quiz_answer.deleteMany({ where: { submission_id: submissionId } });
      } else {
        const created = await tx.academy_quiz_submission.create({
          data: {
            quiz_id: input.quiz_id,
            user_id: auth.userId,
            branch_id: branchId,
            submitted_at: submittedAt,
            score,
          },
        });
        submissionId = created.submission_id;
      }

      if (scored.length > 0) {
        await tx.academy_quiz_answer.createMany({
          data: scored.map((s) => ({
            submission_id: submissionId,
            question_id: s.question_id,
            text_answer: s.text_answer,
            selected_options: s.selected_options,
            is_correct: s.is_correct,
          })),
        });
      }

      return { submission_id: submissionId, submitted_at: submittedAt };
    });

    return {
      ok: true,
      data: {
        submission_id: submission.submission_id,
        submitted_at: submission.submitted_at.toISOString(),
        score: possible > 0 ? { obtained, possible } : null,
      },
    };
  } catch (err) {
    console.error("[submitQuizAnswers] failed:", err);
    const msg = err instanceof Error ? err.message : "Submit failed";
    return { ok: false, error: msg };
  }
}
