import Link from "next/link";
import { PencilLine } from "lucide-react";

interface Props {
  courseSlug: string;
}

export default function AnswerNow({ courseSlug }: Props) {
  return (
    <Link
      href={`/academy/training/${courseSlug}/answer`}
      className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
    >
      <PencilLine className="w-5 h-5" />
      Answer Now
    </Link>
  );
}
