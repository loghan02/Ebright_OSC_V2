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
