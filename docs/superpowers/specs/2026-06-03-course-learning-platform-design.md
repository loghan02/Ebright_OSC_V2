# Course Learning Platform Design

**Date:** 2026-06-03
**Author:** od@ebright.my (with Claude)
**Status:** Draft — pending implementation plan

## Summary

Replace the existing per-course metadata form at
`/academy/training/[course]` with a learning-platform-style page where coaches
add **lessons** (each lesson is a pasted YouTube/Vimeo URL plus zero or more
**exercises**), and students play the videos and upload submissions for the
exercises. The current `ChapterCanvas`-based editor route is deleted entirely.

This is a **demo-only, single-browser prototype**: all data persists to
`localStorage`. Coach content is not shared between browsers, and student
submissions stay on the device they were uploaded from. The shape is correct
for a future server-backed version, but no Prisma model or API endpoint is
created.

## Goals

- Replace `CourseForm` with a coach/student learning view on every
  `/academy/training/course-N` URL.
- Support multiple lessons per course; each lesson has one video URL and zero
  or more exercises.
- Exercises hold coach-supplied instructions plus an optional coach attachment
  (file ≤2MB stored as a data URL).
- Students upload one submission per exercise (file ≤2MB + optional text
  note).
- Coach controls (Add Lesson, Add Exercise, Delete, Edit) are only visible
  when the user can coach.
- Embed YouTube and Vimeo URLs via `<iframe>`. Fall back to a plain link for
  any other URL.

## Non-Goals

- Real video upload (no Vercel Blob, no S3, no local disk).
- Real student-submission storage that survives across browsers.
- Per-cohort or per-branch routing of lessons.
- Tracking, progress bars, grading, comments.
- Migration of any existing `CourseForm` metadata into the new shape —
  current localStorage keys are abandoned.
- Preserving the `/academy/training/[course]/editor` ChapterCanvas route. It
  is deleted.

## Requirements

### Permission

Editors (coaches) are users whose `session.user.role` (case-insensitive) is
one of: `superadmin`, `ceo`, `staff`. Everyone else is a student.

This is *different* from the existing `canEditAcademy` rule (which is
superadmin + ceo only). A new helper is added; the existing helper is
unchanged.

### Components affected

| Path                                                 | Change                                  |
| ---------------------------------------------------- | --------------------------------------- |
| `src/lib/academy-permissions.ts`                     | Add `ACADEMY_COACH_ROLES`, `canCoachCourse()` |
| `src/app/academy/training/[course]/page.tsx`         | Render `<CoursePlatform />` instead of `<CourseForm />`; remove course-form props |
| `src/app/components/CourseForm.tsx`                  | Delete                                  |
| `src/app/academy/training/[course]/editor/`          | Delete the whole route folder           |
| `src/app/components/course-platform/CoursePlatform.tsx` | New                                  |
| `src/app/components/course-platform/LessonCard.tsx`  | New                                     |
| `src/app/components/course-platform/ExerciseRow.tsx` | New                                     |

## Architecture

### 1. Permission helper

Append to `src/lib/academy-permissions.ts`:

```ts
export const ACADEMY_COACH_ROLES = ["superadmin", "ceo", "staff"] as const;

type AcademyCoachRole = (typeof ACADEMY_COACH_ROLES)[number];

export function canCoachCourse(role: string | null | undefined): boolean {
  if (!role) return false;
  return (ACADEMY_COACH_ROLES as readonly string[]).includes(role.toLowerCase());
}

export type { AcademyCoachRole };
```

### 2. Page wiring

`src/app/academy/training/[course]/page.tsx` becomes:

```tsx
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canCoachCourse } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import CoursePlatform from "@/app/components/course-platform/CoursePlatform";

const COURSE_RE = /^course-(\d+)$/;

export default async function TrainingCoursePage({ params }: …) {
  const { course } = await params;
  const n = course.match(COURSE_RE)?.[1];
  if (!n) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const role = (session.user as { role?: string }).role ?? "";
  const canCoach = canCoachCourse(role);

  return (
    <AppShell email={session.user.email} role={role} name={session.user.name ?? null}>
      <CoursePlatform
        courseNum={n}
        courseSlug={course}
        studentEmail={session.user.email}
        canCoach={canCoach}
      />
    </AppShell>
  );
}
```

`studentEmail` is passed so that student submissions can later be keyed by
email if the prototype is upgraded to multi-user storage; the prototype itself
uses a single shared submissions key.

### 3. Data shapes (localStorage)

Two keys per course (`N` is the course number, `1`..`12`+):

**`academy.training.course-N.content`** — coach-managed:

```ts
interface CourseContent {
  lessons: Lesson[];
}

interface Lesson {
  id: string;             // newId() — see below
  title: string;
  videoUrl: string;       // YouTube or Vimeo URL pasted by coach
  exercises: Exercise[];
}

interface Exercise {
  id: string;             // newId()
  instructions: string;
  attachment?: {
    name: string;
    type: string;
    dataUrl: string;      // capped at 2MB
  };
}
```

**`academy.training.course-N.submissions`** — student-uploaded:

```ts
interface Submissions {
  [exerciseId: string]: {
    fileName: string;
    fileType: string;
    dataUrl: string;      // capped at 2MB
    note?: string;
    submittedAt: number;
  };
}
```

`newId()` returns `` `${prefix}_${randomString}` `` (using `crypto.randomUUID()`
short-form to avoid `Math.random()` per existing patterns). Prefix is
`l_` for lessons, `e_` for exercises.

Both keys default to an empty object (`{ lessons: [] }` / `{}`) on first read.

### 4. Component split

All three files live under `src/app/components/course-platform/` and are
client components (`"use client"`).

**`CoursePlatform.tsx`** (~150 lines) — props
`{ courseNum, courseSlug, studentEmail, canCoach }`. Owns the `content` and
`submissions` state, reads/writes both localStorage keys, renders the page
chrome (breadcrumb, header, lessons list, Add Lesson button when
`canCoach`).

**`LessonCard.tsx`** (~100 lines) — props
`{ lesson, canCoach, onUpdate, onDelete }`. Renders one lesson: title (editable
in place when `canCoach`), embedded video, exercises list, Add Exercise button
when `canCoach`. Owns no state above the lesson; reports edits via callbacks.

**`ExerciseRow.tsx`** (~80 lines) — props
`{ exercise, submission, canCoach, onUpdate, onDelete, onSubmit }`. Renders
instructions (editable when `canCoach`), the optional coach attachment as a
download link, and either an upload widget (student, not yet submitted) or
the submitted file with a "Replace" button (student, already submitted).
Coach view shows what was submitted by anyone in this browser as a read-only
note ("Last submission: filename.pdf, 2 days ago").

### 5. Video embed helper

A small pure function `embedVideo(url: string): { kind: "youtube" | "vimeo" | "other"; embedUrl?: string }`
extracts the video ID and returns the right embed URL:

- YouTube: `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID`
  → `https://www.youtube.com/embed/ID`
- Vimeo: `vimeo.com/ID` → `https://player.vimeo.com/video/ID`
- Anything else: `kind: "other"`, no embedUrl — render as a plain link.

This lives in `src/app/components/course-platform/embedVideo.ts` and is a
pure function (no side effects, easy to reason about).

### 6. Coach UI controls

| Control | Where | When visible |
|---|---|---|
| Add Lesson | Below lessons list | `canCoach` |
| Edit lesson title | Inline pencil button on `LessonCard` | `canCoach` |
| Edit video URL | Inline pencil button next to embed | `canCoach` |
| Delete Lesson | Trash button on `LessonCard` | `canCoach` |
| Add Exercise | Bottom of each `LessonCard` | `canCoach` |
| Edit Exercise instructions | Inline editor on `ExerciseRow` | `canCoach` |
| Attach file (coach) | Paperclip button on `ExerciseRow` | `canCoach` |
| Delete Exercise | Trash button on `ExerciseRow` | `canCoach` |

All destructive actions (Delete Lesson, Delete Exercise) prompt
`window.confirm()` first. No further "undo" mechanism — keep the prototype
simple.

### 7. Student UI controls

| Control | Where | When visible |
|---|---|---|
| Play video | Embedded iframe | Always |
| Read instructions | `ExerciseRow` | Always |
| Download coach attachment | If present | Always |
| Upload submission | `ExerciseRow` | Not coach, not yet submitted |
| Replace submission | `ExerciseRow` | Not coach, already submitted |
| Download own submission | `ExerciseRow` | Not coach, already submitted |

## Data Flow

```
On mount → CoursePlatform reads both localStorage keys (content + submissions)
       ↓
state held in CoursePlatform: { content, submissions }
       ↓
Coach edits lesson → LessonCard onUpdate → CoursePlatform setState →
  CoursePlatform useEffect on `content` → write to localStorage
       ↓
Student uploads file → ExerciseRow reads File → FileReader.readAsDataURL →
  onSubmit(exerciseId, submissionData) → CoursePlatform setState on submissions
  → useEffect on `submissions` → write to localStorage
```

State writes are debounced not at all (prototype). If localStorage rejects
because of quota, the write is dropped and a `console.warn()` is logged. The
2MB per-file cap is enforced client-side before calling `setSubmissions`.

## Error Handling

- Upload over 2MB → `window.alert("File too large — max 2MB for prototype")`
  and the upload is rejected before any state mutation.
- Invalid video URL (not YouTube/Vimeo) → embed area shows a plain
  `<a href={url} target="_blank" rel="noopener noreferrer">{url}</a>`.
- localStorage parse failure on load → swallow, treat as empty.
- localStorage quota exceeded on save → `console.warn`, no user-visible
  notification (prototype limitation).

## Testing

No test runner installed. Verification per task:
1. `npx tsc --noEmit` clean.
2. `npm run lint` clean (no new findings).
3. Manual smoke test as both a staff user (coach) and an unauthorized role
   (student) on the same browser:
   - Coach: Add lesson, paste YouTube URL, confirm embed renders. Add
     exercise with instructions. Attach a coach file. Verify content
     persists across page reload.
   - Coach: Edit lesson title, edit video URL, edit exercise instructions,
     delete an exercise, delete a lesson. Confirm each persists.
   - Student (different role logged in): see the same lessons. Upload a
     submission file. Reload — submission still visible. Replace submission.
   - Verify the localStorage keys `academy.training.course-1.content` and
     `academy.training.course-1.submissions` contain the expected JSON.

## Open Questions / Future Work

- Multi-user / multi-device sharing requires moving content to Prisma and
  submissions to a real file store. The current shape maps cleanly to
  `CourseContent` and `Submissions` Prisma models with foreign keys to
  `users`.
- Per-student submission keying (currently a single `submissions` blob shared
  in localStorage) will need to become keyed by `user_id` when this becomes
  multi-user.
- Coach "see all students' submissions" view is intentionally limited to "last
  one in this browser" — not real until we have a real backend.
- The 12 default course slots on the Training Hub remain unchanged; this
  spec only changes what happens *inside* each course page.
- INDUCTION card on the Training landing still links to the existing
  `/induction` system (unchanged).
