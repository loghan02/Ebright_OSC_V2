# Academy Role-Based Edit Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the editing UI of the Ebright Academy (the 6 COURSE cards, the TRAINING hub, and JNR/MDR/SNR grade tables) so that only users with role `superadmin` or `ceo` can edit; every other authenticated user sees the edit UI **visible but disabled**.

**Architecture:** Server pages read `session.user.role`, compute `canEdit` via a single helper at `src/lib/academy-permissions.ts`, and thread the boolean as a prop into the editable client components. Each component adds a `canEdit` prop (default `true`) and applies a unified "visible-but-disabled" treatment when it is `false`. No server endpoints need defending because persistence is currently `localStorage`-only; a forward-looking note in the helper documents the future enforcement requirement.

**Tech Stack:** Next.js 16.2.4 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, NextAuth (JWT session with `role` claim), tiptap 3 for ChapterCanvas. No test runner is installed; verification is via `npm run lint`, `npm run build`, and manual smoke testing in the dev server.

**Spec:** [docs/superpowers/specs/2026-06-03-academy-role-based-access-design.md](../specs/2026-06-03-academy-role-based-access-design.md)

---

## Notes for the implementing engineer

- TDD-style unit tests are not used in this codebase — there is no test framework installed (`package.json` has no `test` script and no `vitest`/`jest`/`mocha` dependency). Verification for each task is via TypeScript compile (`npx tsc --noEmit`), `npm run lint`, and `npm run dev` smoke testing.
- The repository currently has many uncommitted files (`git status` shows the entire Academy feature is untracked). DO NOT use `git add .` or `git add -A`. Always add files by exact path.
- Use the `Edit` tool for in-place changes and the `Write` tool for new files. Read every file before editing it.
- All paths in this plan are absolute from repo root. Windows path separators are not required — forward slashes work in the tools.
- The repo's main branch is `main`. Commits go on the current branch (no PR step in this plan).
- Tailwind v4 supports arbitrary values (`bg-[#ed1c24]`). Keep that idiom consistent.

---

## File Map

**Create:**
- `src/lib/academy-permissions.ts` — the `canEditAcademy()` helper, the `ACADEMY_EDIT_ROLES` constant, and a `requireAcademyEditor()` server helper (forward-looking).

**Modify (components — add `canEdit` prop and apply disabled state):**
- `src/app/components/ChapterCanvas.tsx`
- `src/app/components/SyllabusTable.tsx`
- `src/app/components/JnrSyllabus.tsx`
- `src/app/components/MdrSyllabus.tsx`
- `src/app/components/SnrSyllabus.tsx`
- `src/app/components/QuizBuilder.tsx`
- `src/app/components/UserUITable.tsx`
- `src/app/components/TrainingHub.tsx`
- `src/app/components/ExistingQuizesTable.tsx`
- `src/app/components/UpdateQuizesList.tsx`

**Modify (server pages — read session, compute `canEdit`, pass prop):**
- `src/app/academy/ebright-class-syllabus/jnr/page.tsx`
- `src/app/academy/ebright-class-syllabus/mdr/page.tsx`
- `src/app/academy/ebright-class-syllabus/snr/page.tsx`
- `src/app/academy/ebright-class-syllabus/jnr/[grade]/[chapter]/page.tsx`
- `src/app/academy/ebright-class-syllabus/mdr/[grade]/[chapter]/page.tsx`
- `src/app/academy/ebright-class-syllabus/snr/[grade]/[chapter]/page.tsx`
- `src/app/academy/ebright-class-syllabus/user/schedule/page.tsx`
- `src/app/academy/ebright-class-syllabus/user/leaderboard/page.tsx`
- `src/app/academy/ebright-class-syllabus/user/user-manual/page.tsx`
- `src/app/academy/ebright-class-syllabus/user/user-ui/page.tsx`
- `src/app/academy/ebright-class-syllabus/user/quiz/page.tsx`
- `src/app/academy/ebright-class-syllabus/user/quiz/create/page.tsx`
- `src/app/academy/ebright-class-syllabus/user/quiz/existing/page.tsx`
- `src/app/academy/ebright-class-syllabus/user/quiz/update/page.tsx` (if it exists; otherwise only the `[id]` page)
- `src/app/academy/ebright-class-syllabus/user/quiz/update/[id]/page.tsx`
- `src/app/academy/training/page.tsx`
- `src/app/academy/training/[course]/page.tsx`
- `src/app/academy/training/[course]/editor/page.tsx`

---

## Task 1: Add the permission helper

**Files:**
- Create: `src/lib/academy-permissions.ts`

- [ ] **Step 1: Create the helper file**

Write the following to `src/lib/academy-permissions.ts`:

```ts
import type { Session } from "next-auth";

export const ACADEMY_EDIT_ROLES = ["superadmin", "ceo"] as const;

type AcademyEditRole = (typeof ACADEMY_EDIT_ROLES)[number];

export function canEditAcademy(role: string | null | undefined): boolean {
  if (!role) return false;
  return (ACADEMY_EDIT_ROLES as readonly string[]).includes(role.toLowerCase());
}

/**
 * Forward-looking server helper. Today all Academy persistence is
 * `localStorage` so this is unused. When the persistence layer moves
 * to server endpoints, call this at the top of every mutation handler.
 *
 * Throws a 403 Response when the session's role is not in
 * ACADEMY_EDIT_ROLES.
 */
export function requireAcademyEditor(session: Session | null): void {
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!canEditAcademy(role)) {
    throw new Response("Forbidden", { status: 403 });
  }
}

export type { AcademyEditRole };
```

- [ ] **Step 2: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors mentioning `academy-permissions`. Pre-existing errors elsewhere in the repo can be ignored — only fail this step on errors that reference the new file.

- [ ] **Step 3: Verify the helper behaviour by reading it once more**

Re-read `src/lib/academy-permissions.ts` and confirm:
- `canEditAcademy("superadmin")` returns `true`
- `canEditAcademy("SuperAdmin")` returns `true` (lowercased)
- `canEditAcademy("ceo")` returns `true`
- `canEditAcademy("CEO")` returns `true`
- `canEditAcademy("staff")` returns `false`
- `canEditAcademy("")` returns `false`
- `canEditAcademy(null)` returns `false`
- `canEditAcademy(undefined)` returns `false`

These are inspection checks, not executed tests.

- [ ] **Step 4: Commit**

```bash
git add src/lib/academy-permissions.ts
git commit -m "feat(academy): add canEditAcademy permission helper"
```

---

## Task 2: Gate ChapterCanvas

**Files:**
- Modify: `src/app/components/ChapterCanvas.tsx`

ChapterCanvas currently has a `hideEditTab?: boolean` prop (legacy) and renders a top-edge hover toolbar via `showTab` state. We will add a new prop `canEdit?: boolean` (default `true`). When `canEdit === false`:
1. The edit toolbar still renders, but its inner container gets `opacity-60 cursor-not-allowed pointer-events-none`.
2. The tiptap editor is constructed with `editable: false`.
3. The document-upload button (when `enableDocumentUpload` is true) gets `disabled` and the same disabled styles.
4. A hover tooltip on the disabled toolbar reads: `View only — contact your administrator to edit.` (use a native `title` attribute on the wrapper).

`hideEditTab` is preserved unchanged.

- [ ] **Step 1: Read the file before editing**

```bash
# Use the Read tool on src/app/components/ChapterCanvas.tsx
```

Locate the `ChapterCanvasProps` interface (around line 144) and the default-destructure block in `export default function ChapterCanvas` (around line 256).

- [ ] **Step 2: Add `canEdit` to the props interface**

Use Edit tool to change:

```ts
interface ChapterCanvasProps {
  /** @deprecated - use `breadcrumb` instead. Retained for backwards compatibility. */
  backHref?: string;
  label: string;
  storageKey: string;
  pageCount?: number;
  theme?: ChapterTheme;
  hideEditTab?: boolean;
  breadcrumb?: import("./Breadcrumb").BreadcrumbItem[];
  enableDocumentUpload?: boolean;
}
```

To:

```ts
interface ChapterCanvasProps {
  /** @deprecated - use `breadcrumb` instead. Retained for backwards compatibility. */
  backHref?: string;
  label: string;
  storageKey: string;
  pageCount?: number;
  theme?: ChapterTheme;
  hideEditTab?: boolean;
  breadcrumb?: import("./Breadcrumb").BreadcrumbItem[];
  enableDocumentUpload?: boolean;
  /** When false, the editor and edit toolbar are visible but disabled. Default true. */
  canEdit?: boolean;
}
```

- [ ] **Step 3: Destructure `canEdit` with default `true`**

Change:

```tsx
export default function ChapterCanvas({
  label,
  storageKey,
  pageCount = 2,
  theme = "teal",
  hideEditTab = false,
  enableDocumentUpload = false,
  breadcrumb,
}: ChapterCanvasProps) {
```

To:

```tsx
export default function ChapterCanvas({
  label,
  storageKey,
  pageCount = 2,
  theme = "teal",
  hideEditTab = false,
  enableDocumentUpload = false,
  breadcrumb,
  canEdit = true,
}: ChapterCanvasProps) {
```

- [ ] **Step 4: Make tiptap non-editable when canEdit is false**

Search the file for `useEditor(` (there should be exactly one call). Find the options object passed to it. It will have lines like:

```ts
const editor = useEditor({
  extensions: [...],
  content: ...,
  // …
});
```

Add an `editable: canEdit,` line to the options object. The exact location is inside the `useEditor` call; if the call already has an `editable:` line, replace its value with `canEdit`.

- [ ] **Step 5: Disable the top-edge hover toolbar when canEdit is false**

Search for `{!hideEditTab ? (` (around line 589). The conditional wraps a `<div>` that is the hover edit toolbar. Inside that div, find the innermost wrapper that holds the toolbar buttons (the one with classes like `bg-white border ... shadow-lg ...`). Apply a disabled treatment to it conditionally:

```tsx
<div
  className={`<existing classes> ${canEdit ? "" : "opacity-60 cursor-not-allowed pointer-events-none"}`}
  title={canEdit ? undefined : "View only — contact your administrator to edit."}
>
  ...
</div>
```

If you find more than one wrapper layer, apply the classes to the outermost wrapper that contains all the toolbar buttons but not the open/close trigger area.

- [ ] **Step 6: Disable the document-upload button (when present)**

Search for `enableDocumentUpload && (` (around lines 630 and 655). The first occurrence wraps the upload button; the second wraps the uploaded-file display. Add `disabled={!canEdit}` to the actual `<button>` and `<input type="file">` elements inside the first block, and the same `opacity-60 cursor-not-allowed` to their wrapper.

- [ ] **Step 7: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no new errors mentioning ChapterCanvas. Pre-existing repo errors (if any) should be unchanged.

- [ ] **Step 8: Run lint**

```bash
npm run lint
```

Expected: no new errors mentioning ChapterCanvas.

- [ ] **Step 9: Commit**

```bash
git add src/app/components/ChapterCanvas.tsx
git commit -m "feat(academy): add canEdit prop to ChapterCanvas"
```

---

## Task 3: Gate SyllabusTable

**Files:**
- Modify: `src/app/components/SyllabusTable.tsx`

SyllabusTable already derives `readOnly` from whether `liveData` is supplied (live counts implies read-only; otherwise editable). We need to add an *explicit* `canEdit` prop that, when `false`, forces read-only regardless of `liveData`. Existing read-only-via-liveData behaviour is preserved.

- [ ] **Step 1: Read the file**

Read `src/app/components/SyllabusTable.tsx`. Find lines 79-90.

- [ ] **Step 2: Add `canEdit` prop**

Replace:

```ts
interface Props {
  theme: SyllabusTheme;
  storageKey: string;
  emoji: string;
  label: string;
  gradeHrefBase: string;
  /** When provided, the table renders read-only counts instead of editable cells. */
  liveData?: LiveGradeStat[];
}

export default function SyllabusTable({ theme, storageKey, emoji, label, gradeHrefBase, liveData }: Props) {
  const readOnly = Array.isArray(liveData);
```

With:

```ts
interface Props {
  theme: SyllabusTheme;
  storageKey: string;
  emoji: string;
  label: string;
  gradeHrefBase: string;
  /** When provided, the table renders read-only counts instead of editable cells. */
  liveData?: LiveGradeStat[];
  /** When false, the table renders read-only regardless of liveData. Default true. */
  canEdit?: boolean;
}

export default function SyllabusTable({ theme, storageKey, emoji, label, gradeHrefBase, liveData, canEdit = true }: Props) {
  const readOnly = Array.isArray(liveData) || !canEdit;
```

The `readOnly` variable now folds both signals. No other code in the file needs to change — every existing `readOnly` usage already does the right thing.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/SyllabusTable.tsx
git commit -m "feat(academy): add canEdit prop to SyllabusTable"
```

---

## Task 4: Pass `canEdit` through Jnr/Mdr/Snr syllabus wrappers

**Files:**
- Modify: `src/app/components/JnrSyllabus.tsx`
- Modify: `src/app/components/MdrSyllabus.tsx`
- Modify: `src/app/components/SnrSyllabus.tsx`

These wrappers currently take only `liveData` and pass it to SyllabusTable. We add `canEdit` and pass it through.

- [ ] **Step 1: Edit JnrSyllabus.tsx**

Replace the full contents of `src/app/components/JnrSyllabus.tsx` with:

```tsx
"use client";

import SyllabusTable, { type LiveGradeStat } from "./SyllabusTable";

export default function JnrSyllabus({
  liveData,
  canEdit = true,
}: {
  liveData?: LiveGradeStat[];
  canEdit?: boolean;
}) {
  return (
    <SyllabusTable
      theme="teal"
      storageKey="academy.jnr.syllabus"
      emoji="🎒"
      label="JNR"
      gradeHrefBase="/academy/ebright-class-syllabus/jnr"
      liveData={liveData}
      canEdit={canEdit}
    />
  );
}
```

- [ ] **Step 2: Edit MdrSyllabus.tsx the same way**

Replace its contents with the same shape, substituting these constants from the existing file: `theme="rose"` (or whatever it currently uses — read first), `storageKey="academy.mdr.syllabus"`, `emoji` (whatever current), `label="MDR"`, `gradeHrefBase="/academy/ebright-class-syllabus/mdr"`.

Read `src/app/components/MdrSyllabus.tsx` first to copy the exact constants from the existing code; only the prop signature and the new `canEdit={canEdit}` line are new.

- [ ] **Step 3: Edit SnrSyllabus.tsx the same way**

Read `src/app/components/SnrSyllabus.tsx` first, then apply the same change as Steps 1-2, preserving the existing `theme`, `storageKey`, `emoji`, `label`, `gradeHrefBase` constants.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/JnrSyllabus.tsx src/app/components/MdrSyllabus.tsx src/app/components/SnrSyllabus.tsx
git commit -m "feat(academy): thread canEdit through Jnr/Mdr/Snr syllabus wrappers"
```

---

## Task 5: Gate QuizBuilder

**Files:**
- Modify: `src/app/components/QuizBuilder.tsx`

QuizBuilder currently takes only `editQuizId?: string`. Add `canEdit?: boolean`. When `canEdit === false`:
1. The side toolbar's action buttons (Save Quiz, Publish, Add Question, Add Title, Add Image, Add Section, Duplicate, Undo, Redo) are disabled. Preview stays enabled.
2. All `<input>`, `<textarea>`, `<select>` elements in the question list become `readOnly` (for inputs/textareas) or `disabled` (for selects and checkboxes).
3. The "Settings" panel toggles are disabled.

- [ ] **Step 1: Read the file**

Read `src/app/components/QuizBuilder.tsx`. Note line 70 (props interface) and line 111 (default function signature). Also scan the file for `<button` and `<input`/`<textarea`/`<select` occurrences; you will add `disabled={!canEdit}` or `readOnly={!canEdit}` to each.

- [ ] **Step 2: Update the props**

Change:

```tsx
interface QuizBuilderProps {
  editQuizId?: string;
}

// …

export default function QuizBuilder({ editQuizId }: QuizBuilderProps = {}) {
```

To:

```tsx
interface QuizBuilderProps {
  editQuizId?: string;
  canEdit?: boolean;
}

// …

export default function QuizBuilder({ editQuizId, canEdit = true }: QuizBuilderProps = {}) {
```

- [ ] **Step 3: Disable the side toolbar action buttons**

In the side-toolbar JSX, find each action button (Save Quiz, Publish, Add Question, Add Title, Add Image, Add Section, Duplicate, Undo, Redo). Add `disabled={!canEdit}` to each. Also add this class fragment to the button's `className` prop:

```tsx
className={`<existing classes> ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
```

Leave the Preview and Settings *open* buttons enabled — viewing is allowed.

- [ ] **Step 4: Make question inputs read-only**

For every `<input type="text">`, `<input type="number">`, and `<textarea>` rendered inside a question card, add `readOnly={!canEdit}`. For each `<select>` and `<input type="checkbox">`/`<input type="radio">`, add `disabled={!canEdit}`.

There may be many of these — sweep the file once, end to end, and apply the rule consistently.

- [ ] **Step 5: Disable the question-type "Add/Delete" controls per question**

Within each question card, find the per-question Add option/Delete option/Move question buttons. Add `disabled={!canEdit}` to each.

- [ ] **Step 6: Wrap the editor in a top-level read-only banner (if canEdit is false)**

Just above the side toolbar, render:

```tsx
{!canEdit && (
  <div
    role="status"
    className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg px-4 py-1.5 text-sm font-semibold shadow"
  >
    View only — contact your administrator to edit.
  </div>
)}
```

Place this immediately inside the top-level return of the component, before the main layout. Use the most outer wrapper as the parent.

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add src/app/components/QuizBuilder.tsx
git commit -m "feat(academy): add canEdit prop to QuizBuilder"
```

---

## Task 6: Gate UserUITable

**Files:**
- Modify: `src/app/components/UserUITable.tsx`

UserUITable renders an editable table with rows containing NO/MONTH/NAME/NOTES/HYPERLINK/STATUS, plus an Add Row floating button and a paperclip upload per row. When `canEdit === false`:
1. All inputs become `readOnly`.
2. STATUS select becomes `disabled`.
3. Paperclip upload button + hidden `<input type="file">` becomes `disabled`.
4. Add Row / Delete Row buttons become `disabled`.

- [ ] **Step 1: Read the file**

Read `src/app/components/UserUITable.tsx`. Locate the default export (line 46) and the row render block.

- [ ] **Step 2: Add canEdit prop**

Change:

```tsx
export default function UserUITable() {
```

To:

```tsx
interface UserUITableProps {
  canEdit?: boolean;
}

export default function UserUITable({ canEdit = true }: UserUITableProps = {}) {
```

- [ ] **Step 3: Sweep through inputs and buttons**

Apply the same rule sweep as Task 5 Step 4-5:
- Every text/number `<input>` and `<textarea>` → add `readOnly={!canEdit}`
- Every `<select>` and `<input type="file">` → add `disabled={!canEdit}`
- Every action `<button>` (Add Row, Delete Row, upload-paperclip trigger, status pill click handler) → add `disabled={!canEdit}` and append `${canEdit ? "" : "opacity-60 cursor-not-allowed"}` to className

- [ ] **Step 4: Add read-only banner**

Same banner as Task 5 Step 6, placed at the top of the component's return:

```tsx
{!canEdit && (
  <div
    role="status"
    className="bg-amber-100 text-amber-900 border border-amber-300 rounded-lg px-4 py-2 mb-4 text-sm font-semibold"
  >
    View only — contact your administrator to edit.
  </div>
)}
```

(This one is inline rather than fixed since UserUITable is a normal page element, not a full-screen editor.)

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/app/components/UserUITable.tsx
git commit -m "feat(academy): add canEdit prop to UserUITable"
```

---

## Task 7: Gate TrainingHub

**Files:**
- Modify: `src/app/components/TrainingHub.tsx`

TrainingHub renders the course grid plus two floating action buttons (Add Course, Delete Course). When `canEdit === false`:
1. Both floating buttons become `disabled` and visually muted.
2. The course cards remain clickable (navigation only — the inner editor is gated separately).

- [ ] **Step 1: Read the file**

Read `src/app/components/TrainingHub.tsx`. Locate the default export (line 14) and the floating-buttons block (around line 108).

- [ ] **Step 2: Add canEdit prop**

Change:

```tsx
export default function TrainingHub() {
```

To:

```tsx
interface TrainingHubProps {
  canEdit?: boolean;
}

export default function TrainingHub({ canEdit = true }: TrainingHubProps = {}) {
```

- [ ] **Step 3: Disable the floating action buttons**

Inside the `<div className="fixed bottom-6 right-6 …">` block, find the Delete Course and Add Course `<button>` elements. Add `disabled={!canEdit}` to each, and append `${canEdit ? "" : "opacity-60 cursor-not-allowed"}` to each button's className.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/TrainingHub.tsx
git commit -m "feat(academy): add canEdit prop to TrainingHub"
```

---

## Task 8: Gate ExistingQuizesTable and UpdateQuizesList

**Files:**
- Modify: `src/app/components/ExistingQuizesTable.tsx`
- Modify: `src/app/components/UpdateQuizesList.tsx`

These tables list existing quizzes. Both have row-level action buttons (probably Edit/Delete or Open). When `canEdit === false`:
1. Open/View buttons remain enabled (read-only navigation).
2. Edit/Delete/Publish action buttons (if any) are disabled.

- [ ] **Step 1: Read both files**

Read `src/app/components/ExistingQuizesTable.tsx` and `src/app/components/UpdateQuizesList.tsx`. For each, identify which row buttons are *destructive/mutative* (Delete, Edit, Publish, Toggle) vs *navigational* (Open, View).

- [ ] **Step 2: Add canEdit prop to ExistingQuizesTable**

Change:

```tsx
export default function ExistingQuizesTable() {
```

To:

```tsx
interface ExistingQuizesTableProps {
  canEdit?: boolean;
}

export default function ExistingQuizesTable({ canEdit = true }: ExistingQuizesTableProps = {}) {
```

Then add `disabled={!canEdit}` and the muted-className treatment to every destructive/mutative button. Leave navigational links/buttons enabled.

- [ ] **Step 3: Add canEdit prop to UpdateQuizesList**

Identical signature change:

```tsx
interface UpdateQuizesListProps {
  canEdit?: boolean;
}

export default function UpdateQuizesList({ canEdit = true }: UpdateQuizesListProps = {}) {
```

Then apply the same sweep — disable mutative buttons.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/ExistingQuizesTable.tsx src/app/components/UpdateQuizesList.tsx
git commit -m "feat(academy): add canEdit prop to quiz list components"
```

---

## Task 9: Thread `canEdit` through user-section pages (schedule, leaderboard, user-manual, user-ui)

**Files:**
- Modify: `src/app/academy/ebright-class-syllabus/user/schedule/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/user/leaderboard/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/user/user-manual/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/user/user-ui/page.tsx`

Each page already reads `session.user.role` into a `userRole` variable. We add `canEdit` and pass it to the component.

- [ ] **Step 1: Update schedule/page.tsx**

Read the file first. Then:

1. Add import: `import { canEditAcademy } from "@/lib/academy-permissions";`
2. After the existing `const userRole = …` line, add: `const canEdit = canEditAcademy(userRole);`
3. Add `canEdit={canEdit}` to the `<ChapterCanvas …>` props.

- [ ] **Step 2: Update leaderboard/page.tsx**

Same three changes as Step 1.

- [ ] **Step 3: Update user-manual/page.tsx**

Same three changes.

- [ ] **Step 4: Update user-ui/page.tsx**

Same three changes — pass `canEdit={canEdit}` to `<UserUITable />`.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/app/academy/ebright-class-syllabus/user/schedule/page.tsx src/app/academy/ebright-class-syllabus/user/leaderboard/page.tsx src/app/academy/ebright-class-syllabus/user/user-manual/page.tsx src/app/academy/ebright-class-syllabus/user/user-ui/page.tsx
git commit -m "feat(academy): pass canEdit to user-section editor pages"
```

---

## Task 10: Thread `canEdit` through quiz pages

**Files:**
- Modify: `src/app/academy/ebright-class-syllabus/user/quiz/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/user/quiz/create/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/user/quiz/existing/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/user/quiz/update/[id]/page.tsx`
- Modify (if it exists): `src/app/academy/ebright-class-syllabus/user/quiz/update/page.tsx`

- [ ] **Step 1: Update quiz/page.tsx**

Read first. Add the import and `const canEdit = canEditAcademy(userRole);`. The page renders three nav cards plus `<BranchQuizSummaryTable branches={BRANCHES} />`. Pass `canEdit={canEdit}` to `<BranchQuizSummaryTable>` IF it accepts the prop — check first by reading `src/app/components/BranchQuizSummaryTable.tsx`. If it doesn't currently accept the prop, also add a `canEdit?: boolean` prop to that component using the same pattern as Task 6 (sweep its mutative controls). If the component is purely informational with no edit controls, no change is needed.

- [ ] **Step 2: Update quiz/create/page.tsx**

Add the import, compute `canEdit`, pass `canEdit={canEdit}` to `<QuizBuilder />`.

- [ ] **Step 3: Update quiz/existing/page.tsx**

Add the import, compute `canEdit`, pass `canEdit={canEdit}` to `<ExistingQuizesTable />`.

- [ ] **Step 4: Update quiz/update/[id]/page.tsx**

Add the import, compute `canEdit`, pass `canEdit={canEdit}` to `<QuizBuilder editQuizId={id} canEdit={canEdit} />`.

- [ ] **Step 5: Update quiz/update/page.tsx (if it exists)**

Check if the file exists with `ls "src/app/academy/ebright-class-syllabus/user/quiz/update/page.tsx"`. If yes, read it and apply the same pattern — likely it renders `<UpdateQuizesList />` and needs `canEdit={canEdit}`. If no, skip.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/app/academy/ebright-class-syllabus/user/quiz/
git commit -m "feat(academy): pass canEdit to quiz pages"
```

---

## Task 11: Thread `canEdit` through JNR/MDR/SNR syllabus pages and their chapter editors

**Files:**
- Modify: `src/app/academy/ebright-class-syllabus/jnr/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/mdr/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/snr/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/jnr/[grade]/[chapter]/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/mdr/[grade]/[chapter]/page.tsx`
- Modify: `src/app/academy/ebright-class-syllabus/snr/[grade]/[chapter]/page.tsx`

The grade page (`/jnr`) renders the syllabus table; the chapter page (`/jnr/grade-1/chapter-1`) renders ChapterCanvas. Both need `canEdit`. (Grade landing pages between the syllabus and chapter — `[grade]/page.tsx` — exist; check whether they have any editable UI. If they only navigate, no change is needed.)

- [ ] **Step 1: Update jnr/page.tsx**

Read first. Add the import. Compute `canEdit`. Pass to `<JnrSyllabus liveData={liveData} canEdit={canEdit} />`.

- [ ] **Step 2: Update mdr/page.tsx and snr/page.tsx**

Same change as Step 1, with the right wrapper component name.

- [ ] **Step 3: Update jnr/[grade]/[chapter]/page.tsx**

Read first. Add the import. Compute `canEdit`. Pass `canEdit={canEdit}` to `<ChapterCanvas …>`.

- [ ] **Step 4: Update mdr/[grade]/[chapter]/page.tsx and snr/[grade]/[chapter]/page.tsx**

Same as Step 3.

- [ ] **Step 5: Check the `[grade]/page.tsx` files (no chapter)**

Read `src/app/academy/ebright-class-syllabus/jnr/[grade]/page.tsx` (and mdr/snr equivalents). If they render anything editable (e.g. a chapter list with delete buttons), add the same `canEdit` flow. If they're pure navigation, leave them.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/app/academy/ebright-class-syllabus/jnr/ src/app/academy/ebright-class-syllabus/mdr/ src/app/academy/ebright-class-syllabus/snr/
git commit -m "feat(academy): pass canEdit to JNR/MDR/SNR syllabus and chapter pages"
```

---

## Task 12: Thread `canEdit` through training pages

**Files:**
- Modify: `src/app/academy/training/page.tsx`
- Modify: `src/app/academy/training/[course]/page.tsx`
- Modify: `src/app/academy/training/[course]/editor/page.tsx`

- [ ] **Step 1: Update training/page.tsx**

Read first. Add the import. Compute `canEdit`. Pass to `<TrainingHub canEdit={canEdit} />`.

- [ ] **Step 2: Update training/[course]/page.tsx**

Read first. Determine what it renders. If it renders ChapterCanvas or a similar editable component, pass `canEdit`. If it's a navigation grid (chapter list), check whether it has add/delete buttons — if yes, add canEdit; if no, leave alone.

- [ ] **Step 3: Update training/[course]/editor/page.tsx**

Read first. It almost certainly renders `<ChapterCanvas …>`. Add the import, compute `canEdit`, pass `canEdit={canEdit}`.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/academy/training/
git commit -m "feat(academy): pass canEdit to training pages"
```

---

## Task 13: Full smoke test

**Files:** None modified. Verification only.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Wait for `Ready in …` line.

- [ ] **Step 2: Sign in as a staff user**

Pick any staff user with a known password from the DB. Sign in at `/login`.

- [ ] **Step 3: Walk each affected route as staff**

For each route below, open it in a browser tab and confirm:
- The page loads (no 500).
- Any edit toolbar/buttons are visible but visually muted and unresponsive.
- Tooltip on the disabled wrapper shows the view-only message.
- Hovering and clicking does not trigger save / publish / add-row.

Routes:
- `/academy/ebright-class-syllabus/jnr`
- `/academy/ebright-class-syllabus/jnr/grade-1` → click any chapter → editor
- `/academy/ebright-class-syllabus/mdr`
- `/academy/ebright-class-syllabus/snr`
- `/academy/ebright-class-syllabus/user/schedule`
- `/academy/ebright-class-syllabus/user/leaderboard`
- `/academy/ebright-class-syllabus/user/user-manual`
- `/academy/ebright-class-syllabus/user/user-ui`
- `/academy/ebright-class-syllabus/user/quiz`
- `/academy/ebright-class-syllabus/user/quiz/create`
- `/academy/ebright-class-syllabus/user/quiz/existing`
- `/academy/training`
- `/academy/training/course-1`

- [ ] **Step 4: Sign out, sign in as superadmin**

Hit `/api/auth/signout`. Sign back in with a superadmin user.

- [ ] **Step 5: Walk the same routes as superadmin**

Confirm all edit UI is fully interactive. No muted styles, no view-only tooltip, save/publish/add-row all work normally.

- [ ] **Step 6: Build**

```bash
npm run build
```

Expected: no new errors. Pre-existing errors unrelated to academy changes are acceptable.

- [ ] **Step 7: Final commit**

If there is any incidental fix needed (typo, missing import) discovered during smoke testing, fix it and commit.

```bash
git status
# add any final fixes
git commit -m "fix(academy): smoke-test fixes for role-based edit access"
```

---

## Definition of Done

- [ ] `src/lib/academy-permissions.ts` exists and exports `canEditAcademy`, `ACADEMY_EDIT_ROLES`, `requireAcademyEditor`.
- [ ] Every editable component listed in the File Map accepts a `canEdit?: boolean` prop with default `true`.
- [ ] Every server page listed in the File Map computes `canEdit` from `session.user.role` and passes it to its component.
- [ ] As a `staff` user, all edit UI on all affected routes appears visible but disabled.
- [ ] As a `superadmin` user, all edit UI on all affected routes is fully interactive.
- [ ] `npx tsc --noEmit` and `npm run lint` report no new errors introduced by this work.
- [ ] `npm run build` completes (modulo pre-existing repo errors unrelated to academy).
