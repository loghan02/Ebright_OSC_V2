import { Pool } from "pg";

// Read-only pool for ebrightleads_db (studentrecords table).
// Hot-reload-safe: store a single instance on globalThis in dev so we don't
// open a new pool on every save.
const globalForLeads = globalThis as unknown as { __leadsPool?: Pool };

export const leadsPool: Pool =
  globalForLeads.__leadsPool ??
  new Pool({
    connectionString: process.env.EBRIGHTLEADS_DATABASE_URL,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForLeads.__leadsPool = leadsPool;
}

export type AgeGroup = "JUNIOR" | "MIDDLER" | "SENIOR";

export interface GradeStat {
  grade: number; // 1..8
  enrol: number;
  finished: number;
  balance: number;
}

/**
 * For a given age group, count students per grade (1..8) based on `grade_chapter`
 * which is shaped like "G3 — C5".
 * - ENROL    = currently active students at that grade (any chapter)
 * - FINISHED = students who have completed all three progress totals (X == Y for fa, pcm, workbook)
 * - BALANCE  = ENROL − FINISHED
 */
export async function getGradeStats(ageGroup: AgeGroup): Promise<GradeStat[]> {
  const sql = `
    WITH active AS (
      SELECT
        SUBSTRING(grade_chapter FROM '^G(\\d+)')::int AS grade,
        CASE
          WHEN total_fa ~ '^\\d+/\\d+$'
            AND total_pcm ~ '^\\d+/\\d+$'
            AND total_workbook ~ '^\\d+/\\d+$'
            AND split_part(total_fa, '/', 1) = split_part(total_fa, '/', 2)
            AND split_part(total_pcm, '/', 1) = split_part(total_pcm, '/', 2)
            AND split_part(total_workbook, '/', 1) = split_part(total_workbook, '/', 2)
          THEN 1 ELSE 0
        END AS is_finished
      FROM studentrecords
      WHERE age_group = $1
        AND status = 'Active'
        AND grade_chapter ~ '^G[1-8]'
    )
    SELECT grade,
           COUNT(*)::int AS enrol,
           SUM(is_finished)::int AS finished
    FROM active
    GROUP BY grade
    ORDER BY grade
  `;
  const res = await leadsPool.query<{ grade: number; enrol: number; finished: number }>(sql, [ageGroup]);

  // Always return rows 1..8 even when a grade has no students.
  const byGrade = new Map(res.rows.map((r) => [r.grade, r]));
  const out: GradeStat[] = [];
  for (let g = 1; g <= 8; g++) {
    const row = byGrade.get(g);
    const enrol = row?.enrol ?? 0;
    const finished = row?.finished ?? 0;
    out.push({ grade: g, enrol, finished, balance: enrol - finished });
  }
  return out;
}
