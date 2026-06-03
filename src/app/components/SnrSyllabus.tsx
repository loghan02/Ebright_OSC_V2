"use client";

import SyllabusTable, { type LiveGradeStat } from "./SyllabusTable";

export default function SnrSyllabus({
  liveData,
  canEdit = true,
}: {
  liveData?: LiveGradeStat[];
  canEdit?: boolean;
}) {
  return (
    <SyllabusTable
      theme="amber"
      storageKey="academy.snr.syllabus"
      emoji="🎓"
      label="SNR"
      gradeHrefBase="/academy/ebright-class-syllabus/snr"
      liveData={liveData}
      canEdit={canEdit}
    />
  );
}
