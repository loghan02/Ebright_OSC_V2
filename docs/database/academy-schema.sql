-- =============================================================================
-- Academy schema (PostgreSQL DDL)
--
-- Run against the same database that hosts the existing `users` and `branch`
-- tables. Foreign keys assume those tables exist with the column names used
-- in the current Prisma schema (`users.user_id`, `branch.branch_id`).
--
-- All names are snake_case to match the existing project convention.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. academy_document — ChapterCanvas content blobs
-- -----------------------------------------------------------------------------

CREATE TABLE academy_document (
    document_id          SERIAL       PRIMARY KEY,
    storage_key          VARCHAR(255) NOT NULL UNIQUE,
    content              JSONB        NOT NULL,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by_user_id   INTEGER      NULL,
    CONSTRAINT fk_academy_doc_user
        FOREIGN KEY (updated_by_user_id) REFERENCES users (user_id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 2. academy_syllabus_table — JNR/MDR/SNR editable cells
-- -----------------------------------------------------------------------------

CREATE TABLE academy_syllabus_table (
    table_id    SERIAL       PRIMARY KEY,
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    cells       JSONB        NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. academy_user_ui_row — USER UI table rows (per user)
-- -----------------------------------------------------------------------------

CREATE TABLE academy_user_ui_row (
    row_id              SERIAL       PRIMARY KEY,
    user_id             INTEGER      NOT NULL,
    position            INTEGER      NOT NULL DEFAULT 0,
    no                  VARCHAR(50)  NULL,
    month               VARCHAR(50)  NULL,
    name                VARCHAR(255) NULL,
    notes               TEXT         NULL,
    hyperlink           TEXT         NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'INCOMPLETE',
    file_name           VARCHAR(255) NULL,
    file_mime           VARCHAR(100) NULL,
    file_size           INTEGER      NULL,
    file_url            TEXT         NULL,
    file_uploaded_at    TIMESTAMPTZ  NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_ui_row_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_ui_row_user ON academy_user_ui_row (user_id);

-- -----------------------------------------------------------------------------
-- 4. academy_training_course — course slots (course-1, course-2, …)
-- -----------------------------------------------------------------------------

CREATE TABLE academy_training_course (
    course_id           SERIAL       PRIMARY KEY,
    course_number       INTEGER      NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by_user_id  INTEGER      NULL,
    archived_at         TIMESTAMPTZ  NULL,
    CONSTRAINT fk_course_creator
        FOREIGN KEY (created_by_user_id) REFERENCES users (user_id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 5. academy_course_video — video URLs per course
-- -----------------------------------------------------------------------------

CREATE TABLE academy_course_video (
    video_id   SERIAL       PRIMARY KEY,
    course_id  INTEGER      NOT NULL,
    title      VARCHAR(255) NULL,
    video_url  TEXT         NOT NULL,
    position   INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_course_video_course
        FOREIGN KEY (course_id) REFERENCES academy_training_course (course_id) ON DELETE CASCADE
);

CREATE INDEX idx_course_video_course ON academy_course_video (course_id);

-- -----------------------------------------------------------------------------
-- 6. academy_course_exercise — exercises per course
-- -----------------------------------------------------------------------------

CREATE TABLE academy_course_exercise (
    exercise_id  SERIAL       PRIMARY KEY,
    course_id    INTEGER      NOT NULL,
    position     INTEGER      NOT NULL DEFAULT 0,
    instructions TEXT         NOT NULL,
    file_name    VARCHAR(255) NULL,
    file_mime    VARCHAR(100) NULL,
    file_size    INTEGER      NULL,
    file_url     TEXT         NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_exercise_course
        FOREIGN KEY (course_id) REFERENCES academy_training_course (course_id) ON DELETE CASCADE
);

CREATE INDEX idx_exercise_course ON academy_course_exercise (course_id);

-- -----------------------------------------------------------------------------
-- 7. academy_exercise_answer — student text answers
-- -----------------------------------------------------------------------------

CREATE TABLE academy_exercise_answer (
    answer_id   SERIAL      PRIMARY KEY,
    exercise_id INTEGER     NOT NULL,
    user_id     INTEGER     NOT NULL,
    answer_text TEXT        NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_answer_exercise
        FOREIGN KEY (exercise_id) REFERENCES academy_course_exercise (exercise_id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_student
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT uq_answer_exercise_student UNIQUE (exercise_id, user_id)
);

CREATE INDEX idx_answer_student ON academy_exercise_answer (user_id);

-- -----------------------------------------------------------------------------
-- 8. academy_course_submission — student file uploads (course-wide)
-- -----------------------------------------------------------------------------

CREATE TABLE academy_course_submission (
    submission_id SERIAL       PRIMARY KEY,
    course_id     INTEGER      NOT NULL,
    user_id       INTEGER      NOT NULL,
    file_name     VARCHAR(255) NOT NULL,
    file_mime     VARCHAR(100) NOT NULL,
    file_size     INTEGER      NULL,
    file_url      TEXT         NOT NULL,
    uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_submission_course
        FOREIGN KEY (course_id) REFERENCES academy_training_course (course_id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_student
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX idx_submission_course_student ON academy_course_submission (course_id, user_id);

-- -----------------------------------------------------------------------------
-- 9. academy_exercise_mark — coach marks (score + comment)
-- -----------------------------------------------------------------------------

CREATE TABLE academy_exercise_mark (
    mark_id            SERIAL       PRIMARY KEY,
    exercise_id        INTEGER      NOT NULL,
    user_id            INTEGER      NOT NULL,  -- student being marked
    score              VARCHAR(50)  NULL,
    comment            TEXT         NULL,
    marked_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    marked_by_user_id  INTEGER      NOT NULL,  -- coach
    CONSTRAINT fk_mark_exercise
        FOREIGN KEY (exercise_id) REFERENCES academy_course_exercise (exercise_id) ON DELETE CASCADE,
    CONSTRAINT fk_mark_student
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_mark_coach
        FOREIGN KEY (marked_by_user_id) REFERENCES users (user_id) ON DELETE NO ACTION,
    CONSTRAINT uq_mark_exercise_student UNIQUE (exercise_id, user_id)
);

CREATE INDEX idx_mark_coach ON academy_exercise_mark (marked_by_user_id);

-- -----------------------------------------------------------------------------
-- 10. academy_quiz — quiz definitions
-- -----------------------------------------------------------------------------

CREATE TABLE academy_quiz (
    quiz_id            SERIAL       PRIMARY KEY,
    title              VARCHAR(255) NOT NULL,
    description        TEXT         NULL,
    settings           JSONB        NULL,
    is_published       BOOLEAN      NOT NULL DEFAULT FALSE,
    published_at       TIMESTAMPTZ  NULL,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by_user_id INTEGER      NOT NULL,
    CONSTRAINT fk_quiz_creator
        FOREIGN KEY (created_by_user_id) REFERENCES users (user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_quiz_creator ON academy_quiz (created_by_user_id);

-- -----------------------------------------------------------------------------
-- 11. academy_quiz_question — typed questions
-- -----------------------------------------------------------------------------

CREATE TABLE academy_quiz_question (
    question_id SERIAL       PRIMARY KEY,
    quiz_id     INTEGER      NOT NULL,
    position    INTEGER      NOT NULL DEFAULT 0,
    type        VARCHAR(30)  NOT NULL,
    prompt      TEXT         NOT NULL,
    is_required BOOLEAN      NOT NULL DEFAULT FALSE,
    meta        JSONB        NULL,
    CONSTRAINT fk_question_quiz
        FOREIGN KEY (quiz_id) REFERENCES academy_quiz (quiz_id) ON DELETE CASCADE
);

CREATE INDEX idx_question_quiz ON academy_quiz_question (quiz_id);

-- -----------------------------------------------------------------------------
-- 12. academy_quiz_question_option — choices for MC/checkbox/dropdown
-- -----------------------------------------------------------------------------

CREATE TABLE academy_quiz_question_option (
    option_id   SERIAL  PRIMARY KEY,
    question_id INTEGER NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0,
    label       TEXT    NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_option_question
        FOREIGN KEY (question_id) REFERENCES academy_quiz_question (question_id) ON DELETE CASCADE
);

CREATE INDEX idx_option_question ON academy_quiz_question_option (question_id);

-- -----------------------------------------------------------------------------
-- 13. academy_quiz_branch — M:N quiz x branch (publish targets)
-- -----------------------------------------------------------------------------

CREATE TABLE academy_quiz_branch (
    quiz_id   INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    PRIMARY KEY (quiz_id, branch_id),
    CONSTRAINT fk_quiz_branch_quiz
        FOREIGN KEY (quiz_id) REFERENCES academy_quiz (quiz_id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_branch_branch
        FOREIGN KEY (branch_id) REFERENCES branch (branch_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 14. academy_quiz_submission — student submissions
-- -----------------------------------------------------------------------------

CREATE TABLE academy_quiz_submission (
    submission_id SERIAL       PRIMARY KEY,
    quiz_id       INTEGER      NOT NULL,
    user_id       INTEGER      NOT NULL,
    branch_id     INTEGER      NULL,
    submitted_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    score         NUMERIC(6,2) NULL,
    CONSTRAINT fk_submission_quiz
        FOREIGN KEY (quiz_id) REFERENCES academy_quiz (quiz_id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_student_quiz
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_branch
        FOREIGN KEY (branch_id) REFERENCES branch (branch_id) ON DELETE SET NULL,
    CONSTRAINT uq_quiz_submission_student_branch UNIQUE (quiz_id, user_id, branch_id)
);

CREATE INDEX idx_quiz_submission_quiz   ON academy_quiz_submission (quiz_id);
CREATE INDEX idx_quiz_submission_user   ON academy_quiz_submission (user_id);
CREATE INDEX idx_quiz_submission_branch ON academy_quiz_submission (branch_id);

-- -----------------------------------------------------------------------------
-- 15. academy_quiz_answer — per-question answer in a submission
-- -----------------------------------------------------------------------------

CREATE TABLE academy_quiz_answer (
    answer_id        SERIAL    PRIMARY KEY,
    submission_id    INTEGER   NOT NULL,
    question_id      INTEGER   NOT NULL,
    text_answer      TEXT      NULL,
    selected_options INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    is_correct       BOOLEAN   NULL,
    CONSTRAINT fk_quiz_answer_submission
        FOREIGN KEY (submission_id) REFERENCES academy_quiz_submission (submission_id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_answer_question
        FOREIGN KEY (question_id) REFERENCES academy_quiz_question (question_id) ON DELETE CASCADE,
    CONSTRAINT uq_quiz_answer_submission_question UNIQUE (submission_id, question_id)
);

-- -----------------------------------------------------------------------------
-- updated_at triggers (optional but recommended)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION academy_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_academy_document_updated      BEFORE UPDATE ON academy_document      FOR EACH ROW EXECUTE FUNCTION academy_touch_updated_at();
CREATE TRIGGER trg_academy_syllabus_table_upd    BEFORE UPDATE ON academy_syllabus_table FOR EACH ROW EXECUTE FUNCTION academy_touch_updated_at();
CREATE TRIGGER trg_academy_user_ui_row_upd       BEFORE UPDATE ON academy_user_ui_row    FOR EACH ROW EXECUTE FUNCTION academy_touch_updated_at();
CREATE TRIGGER trg_academy_course_video_upd      BEFORE UPDATE ON academy_course_video   FOR EACH ROW EXECUTE FUNCTION academy_touch_updated_at();
CREATE TRIGGER trg_academy_course_exercise_upd   BEFORE UPDATE ON academy_course_exercise FOR EACH ROW EXECUTE FUNCTION academy_touch_updated_at();
CREATE TRIGGER trg_academy_exercise_answer_upd   BEFORE UPDATE ON academy_exercise_answer FOR EACH ROW EXECUTE FUNCTION academy_touch_updated_at();
CREATE TRIGGER trg_academy_quiz_upd              BEFORE UPDATE ON academy_quiz           FOR EACH ROW EXECUTE FUNCTION academy_touch_updated_at();

COMMIT;
