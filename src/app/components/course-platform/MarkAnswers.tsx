import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

interface Props {
  courseSlug: string;
}

export default function MarkAnswers({ courseSlug }: Props) {
  return (
    <Link
      href={`/academy/training/${courseSlug}/review`}
      className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
    >
      <ClipboardCheck className="w-5 h-5" />
      Mark Answers
    </Link>
  );
}
