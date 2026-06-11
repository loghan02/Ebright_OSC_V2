# Academy — Role-Based Edit Access Design

**Date:** 2026-06-03
**Author:** od@ebright.my (with Claude)
**Status:** Draft — pending implementation plan

## Summary

The six COURSE cards on the Ebright Class Syllabus page (INDUCTION, SCHEDULE,
LEADERBOARD, QUIZ, USER MANUAL, USER UI) and the TRAINING hub should be
**viewable by every authenticated user**, but only editable by users in the
`superadmin` or `ceo` role. Other roles see the edit UI in a **disabled,
greyed-out state** so it is discoverable but non-interactive.

## Goals

- Every authenticated user can navigate into all six cards and read content.
- Only `superadmin` and `ceo` can change content.
- View-only users see the edit controls **visible but disabled** (not hidden),
  with a tooltip explaining why.
- A single source of truth for the editor allowlist (one helper function).
- Server-side hooks ready for the day persistence moves off `localStorage`.

## Non-Goals

- Per-card role mapping. All six cards share the same edit allowlist.
- Email-based allowlists. Pure role check, case-insensitive.
- Admin UI for managing the allowlist. The list is hardcoded.
- Migrating persistence from `localStorage` to a server store. Out of scope; a
  forward-looking hook is documented but not implemented.

## Requirements

### Roles

- **Editors:** `superadmin`, `ceo` (case-insensitive match against
  `session.user.role`).
- **Viewers:** every other authenticated role (`hr`, `admin`, `staff`,
  position-derived roles like `PT COACH`, anyone else).

### Components affected

| Route                                                            | Component        |
| ---------------------------------------------------------------- | ---------------- |
| `/academy/ebright-class-syllabus/user/schedule`                  | `ChapterCanvas`  |
| `/academy/ebright-class-syllabus/user/leaderboard`               | `ChapterCanvas`  |
| `/academy/ebright-class-syllabus/user/user-manual`               | `ChapterCanvas`  |
| `/academy/ebright-class-syllabus/user/quiz` + builder/update     | `QuizBuilder`    |
| `/academy/ebright-class-syllabus/user/user-ui`                   | `UserUITable`    |
| `/academy/training` + `/academy/training/[course]/...`           | `TrainingHub`, `ChapterCanvas` |
| `/academy/ebright-class-syllabus/jnr|mdr|snr` (Grade tables)     | `SyllabusTable`  |

INDUCTION currently has `href="#"` and no destination page. Out of scope until
the destination is built.

## Architecture

### 1. Permission helper

A single source of truth lives at `src/lib/academy-permissions.ts`:

```ts
export const ACADEMY_EDIT_ROLES = ["superadmin", "ceo"] as const;

export function canEditAcademy(role: string | null | undefined): boolean {
  if (!role) return false;
  return ACADEMY_EDIT_ROLES.includes(
    role.toLowerCase() as (typeof ACADEMY_EDIT_ROLES)[number],
  );
}
```

Used by:

- Every academy page that wraps an editable component (server-side read of
  `session.user.role`).
- Future server endpoints that mutate academy content (defense in depth).

### 2. Page-level prop threading

Each destination page reads the session, computes `canEdit`, and passes it
explicitly to its top-level editable component. Example for the schedule page:

```tsx
const session = await getServerSession(authOptions);
if (!session?.user?.email) redirect("/login");
const role = (session.user as { role?: string }).role ?? "";
const canEdit = canEditAcademy(role);

return (
  <AppShell email={...} role={role} name={...}>
    <ChapterCanvas
      backHref="/academy/ebright-class-syllabus/user"
      label="SCHEDULE"
      storageKey="..."
      pageCount={2}
      theme="amber"
      canEdit={canEdit}
      breadcrumb={[...]}
    />
  </AppShell>
);
```

The pattern repeats for leaderboard, user-manual, quiz, user-ui, training
hub, and per-course training pages. JNR/MDR/SNR grade pages already pass
`readOnly` to `SyllabusTable`; they will pass `readOnly={!canEdit}` instead of
the current `false`.

### 3. Per-component disabled patterns

Each component accepts a new `canEdit?: boolean` prop (default `true` to
preserve current behaviour for any existing callers).

The shared visual rule when `canEdit === false`:

- Edit-control containers receive `opacity-60 cursor-not-allowed pointer-events-none`.
- Actual `<button>` and `<input>` elements receive the native `disabled`
  attribute.
- A hover tooltip reads: *"View only — contact your administrator to edit."*

Component-by-component:

- **ChapterCanvas** — Top-hover edit toolbar wrapper disabled. tiptap
  `editable: false`. Document-upload button disabled. Page-break controls
  disabled. Insert panels (Tables, Shapes, etc.) disabled. The A4 paper still
  renders content in read mode so users can scroll the document.
- **QuizBuilder** — Side toolbar disabled (Preview stays enabled). Question
  inputs `readOnly`. Save Quiz, Publish, Duplicate, Undo, Redo all disabled.
  Existing quizzes list opens but rows are read-only.
- **UserUITable** — Row inputs `readOnly`. NOTES paperclip upload disabled.
  STATUS dropdown disabled. Add Row / Delete Row buttons disabled.
- **TrainingHub** — Floating Add Course and Delete Course buttons disabled.
  Course cards remain clickable (the inner editor is gated too).
- **SyllabusTable** — Reuse existing `readOnly` mode, driven by `!canEdit`.

### 4. Server enforcement (forward-looking)

Today, all persistence is `localStorage` (per-user, per-browser). There is no
shared server state to defend.

When persistence moves off the browser, every mutation endpoint must call:

```ts
function requireAcademyEditor(session: Session | null) {
  const role = (session?.user as { role?: string })?.role;
  if (!canEditAcademy(role)) {
    throw new Response("Forbidden", { status: 403 });
  }
}
```

A reminder note will live next to `canEditAcademy` in the source file.

## Data Flow

```
session.user.role
       │
       ▼
canEditAcademy(role)  ──► boolean
       │
       ▼
<Page server component>
       │ canEdit={…} prop
       ▼
<Editor component (client)>
       │ if (!canEdit) → disable UI
       ▼
visible-but-disabled edit toolbar / inputs / buttons
```

## Error Handling

Not applicable. The flag is a pure boolean; no fetches, no failure paths.
Unknown roles default to `canEdit === false` (safe fallback).

## Testing

- Unit test `canEditAcademy()` against: `"superadmin"`, `"SuperAdmin"`,
  `"ceo"`, `"CEO"`, `"staff"`, `"hr"`, `"admin"`, `""`, `null`, `undefined`.
- Manual smoke test:
  1. Log in as a `staff` user → open `/academy/ebright-class-syllabus/user/schedule`
     → confirm toolbar is visible but greyed and clicks are ignored.
  2. Log in as a `superadmin` user → same page → confirm editing works.
  3. Repeat for each of the seven affected routes.

## Open Questions / Future Work

- INDUCTION destination is not yet built; once it is, the same `canEdit`
  prop must be applied.
- When persistence moves to a server endpoint, the
  `requireAcademyEditor()` helper must be added at every mutation site.
- If the editor allowlist needs to expand (e.g. include `hr`), edit the
  `ACADEMY_EDIT_ROLES` constant only.
