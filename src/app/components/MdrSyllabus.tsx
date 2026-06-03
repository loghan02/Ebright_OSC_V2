"use client";

import SyllabusTable, { type LiveGradeStat } from "./SyllabusTable";

export default function MdrSyllabus({
  liveData,
  canEdit = true,
}: {
  liveData?: LiveGradeStat[];
  canEdit?: boolean;
}) {
  return (
    <SyllabusTable
      theme="rose"
      storageKey="academy.mdr.syllabus"
      emoji="💼"
      label="MDR"
      gradeHrefBase="/academy/ebright-class-syllabus/mdr"
      liveData={liveData}
      canEdit={canEdit}
    />
  );
}
