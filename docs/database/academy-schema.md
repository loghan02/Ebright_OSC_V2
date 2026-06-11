# Academy Database Schema

**Date:** 2026-06-03
**Scope:** All Academy features (Ebright Class Syllabus + Employee Training).
**Persistence target:** PostgreSQL via Prisma.

## Why this exists

The Academy section is currently built as a localStorage-only prototype. This
document defines the relational schema needed to make it real: shared across
browsers, users, and devices.

## Table list (15 tables)

### Shared document storage (2 tables)

| Table | Purpose |
| --- | --- |
| `academy_document` | ChapterCanvas content (chapter pages, INDUCTION, LEADERBOARD, USER MANUAL, LESSONS placeholder, course editor). One row per A4-editor instance, keyed by `storage_key`. Content is JSONB. |
| `academy_syllabus_table` | JNR/MDR/SNR Grade 1-8 ENROL/FINISHED/BALANCE tables in editable mode. JSONB cells. (When live counts come from `ebrightleads_db.studentrecords`, this table is bypassed.) |

### USER UI table (1 table)

| Table | Purpose |
| --- | --- |
| `academy_user_ui_row` | One row per row in the User UI table, scoped per user. Holds NO/MONTH/NAME/NOTES/HYPERLINK/STATUS plus an optional file attachment. |

### Course platform (7 tables)

| Table | Purpose |
| --- | --- |
| `academy_training_course` | Course slots (COURSE 1, COURSE 2, …). One row per course; supports add/delete. |
| `academy_course_video` | Video URLs per course (current prototype has one per course, schema allows many). |
| `academy_course_exercise` | Exercises published per course. Includes optional coach attachment (inlined file metadata). |
| `academy_exercise_answer` | Student text answers, one per `(exercise_id, user_id)`. |
| `academy_course_submission` | Student file uploads per course (each upload is a new row; not tied to a specific exercise). |
| `academy_exercise_mark` | Coach marks per student answer: free-form score string + comment. One per `(exercise_id, user_id)`. |

### Quiz system (5 tables)

| Table | Purpose |
| --- | --- |
| `academy_quiz` | Quiz definitions: title, settings (anonymous/etc.), draft/published, created_by. |
| `academy_quiz_question` | One row per question in a quiz. Question type (multiple-choice/checkboxes/short-answer/paragraph/dropdown/title-block/image/section) determines which fields/options apply; type-specific extras live in a `meta` JSONB column. |
| `academy_quiz_question_option` | Choices for MC/checkbox/dropdown questions. Each option can be flagged as correct. |
| `academy_quiz_branch` | Many-to-many between a published quiz and the branches it's visible to. |
| `academy_quiz_submission` | One row per student per quiz (per branch). |
| `academy_quiz_answer` | Per-question answer within a submission. Text answer or chosen option(s) — kept flexible via JSONB. |

Total: 15 tables (1+1+1+7+6 — re-counted with two doc tables + 1 user-ui + 7 course-platform + 5 quiz = 15... actually 16 if you split quiz_branch and quiz_submission+quiz_answer, see below).

### Recount

1. `academy_document`
2. `academy_syllabus_table`
3. `academy_user_ui_row`
4. `academy_training_course`
5. `academy_course_video`
6. `academy_course_exercise`
7. `academy_exercise_answer`
8. `academy_course_submission`
9. `academy_exercise_mark`
10. `academy_quiz`
11. `academy_quiz_question`
12. `academy_quiz_question_option`
13. `academy_quiz_branch`
14. `academy_quiz_submission`
15. `academy_quiz_answer`

**Confirmed: 15 tables.**

## Design decisions

### Why a generic `academy_document` table instead of per-feature tables

Every page that renders `ChapterCanvas` produces the same shape:
`{ pages: string[], pageNumber, header, footer, textBoxes, … }`. Modelling each
section relationally would create dozens of tables (one per chapter slot × 3
levels × 8 grades × 12 chapters = 288 row-per-chapter rows, plus all the
sections like INDUCTION, LEADERBOARD, etc.). A single JSONB column keyed by
the page's `storage_key` keeps it flat and queryable enough.

Trade-off: you can't SQL-query "every page with a table containing the word
'photosynthesis'" without JSON path queries. Acceptable.

### Inlined file metadata vs separate `academy_file` table

File metadata (name, mime, size, url) is duplicated across tables that own
files: `academy_user_ui_row`, `academy_course_exercise`, `academy_course_submission`.
This is a denormalisation in exchange for simpler joins. Each owning row has
its file inline.

The `url` column holds whatever URL pattern your storage uses:
- `data:application/pdf;base64,…` for migration from the current localStorage prototype (will be large; OK for proof-of-concept)
- `https://your-bucket.s3.amazonaws.com/…` for S3
- `/uploads/…` for local disk
- whatever else you adopt

When you move to a real file store, run a migration: parse data URLs into
files, upload them, replace `url` with the new external URL.

### Quiz schema: hybrid relational + JSONB

Questions are typed (multiple-choice / short-answer / image / section / etc.).
A pure relational schema would need either:
- A union table per question type (lots of tables, sparse joins), or
- A wide table with many nullable columns (ugly).

Compromise: every question has `type VARCHAR`, `prompt TEXT`, and a `meta JSONB`
for any type-specific config (e.g. for `image` questions: `{imageUrl, caption}`;
for `section`: `{description}`). Options for choice-style questions get a real
relational table (`academy_quiz_question_option`) so you can count, score, and
randomise them properly.

Answers in a submission use the same pattern: `selected_options Int[]` for
choice answers, `text_answer TEXT` for free-form. Either or both may be null
depending on question type.

### Per-student uniqueness

These pairs are unique:
- `academy_exercise_answer.(exercise_id, user_id)` — one answer per student per exercise. Re-submitting overwrites.
- `academy_exercise_mark.(exercise_id, user_id)` — one mark per student per exercise.
- `academy_quiz_submission.(quiz_id, user_id, branch_id)` — one submission per (quiz, student, branch). If the same student is in multiple branches and the quiz is published to all, they can submit once per branch.

### Soft delete

`academy_training_course` has `archived_at` for soft delete (because deleting a
course should preserve historical submissions and answers). All other tables
use hard delete + cascade.

### Indexes

Every foreign key gets an index. Composite unique constraints double as
indexes. No additional indexes added until query patterns are observed.

## Foreign keys to existing tables

| New table | Column | References |
| --- | --- | --- |
| `academy_document` | `updated_by_user_id` | `users.user_id` (nullable) |
| `academy_user_ui_row` | `user_id` | `users.user_id` |
| `academy_training_course` | `created_by_user_id` | `users.user_id` (nullable) |
| `academy_course_exercise` | (no direct user FK; via course) | — |
| `academy_exercise_answer` | `user_id` | `users.user_id` |
| `academy_course_submission` | `user_id` | `users.user_id` |
| `academy_exercise_mark` | `user_id`, `marked_by_user_id` | `users.user_id` |
| `academy_quiz` | `created_by_user_id` | `users.user_id` |
| `academy_quiz_branch` | `branch_id` | `branch.branch_id` |
| `academy_quiz_submission` | `user_id`, `branch_id` | `users.user_id`, `branch.branch_id` |

Inverse relations need to be added to existing `users` and `branch` models in
`schema.prisma`. The Prisma additions file lists exactly which back-references
to add.

## How to apply

### Option A — Prisma (recommended)

1. Open `prisma/schema.prisma`.
2. Paste the model definitions from `docs/database/academy-schema.prisma` at the bottom.
3. Add the listed back-references (`@relation` arrays) to `users` and `branch`
   models.
4. Run:
   ```
   npx prisma migrate dev --name academy_initial
   ```
   This generates a `migrations/<timestamp>_academy_initial/migration.sql` file
   and applies it. Inspect that generated SQL before pushing to prod.
5. Run `npx prisma generate` to regenerate the typed client.

### Option B — Raw SQL

1. Connect to the target database (e.g. `psql $DATABASE_URL`).
2. Run `\i docs/database/academy-schema.sql` (or paste contents).
3. Note: Prisma won't track these tables unless you also run
   `prisma db pull` afterwards to introspect them back into `schema.prisma`.
4. Then `prisma generate` to get typed access.

## Migration from localStorage

Not included in this design — a separate migration script will be needed. It
needs to:
1. For each user that has localStorage entries, dump them server-side somehow
   (browser-driven export?).
2. Parse data URLs into binary files and upload them.
3. Insert rows into the new tables.

That's effort. For the initial cutover, the simplest path is: ship the new
schema empty, let new content accumulate, and don't migrate the prototype's
local data at all.

## Open questions / future work

- File storage backend (S3 / Vercel Blob / local) — schema is agnostic, but
  picking one is required before launch.
- Coach review-vs-edit boundary: today `canCoachCourse` allows
  superadmin/ceo/staff. Should marking and publishing share that rule, or
  should `marked_by_user_id` only be filled by certain roles? Not modelled in
  the schema; enforce in application code.
- Quiz answer scoring: schema stores raw answers; auto-scoring against
  `correct` options is application-layer work.
- Audit log of edits: not modelled. Could add `academy_audit_log` later.
